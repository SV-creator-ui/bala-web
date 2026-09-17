/**
 * Rate limiting — Upstash Redis + @upstash/ratelimit (sliding window).
 * ─────────────────────────────────────────────────────────────────
 * Vercel serverless netinka in-memory throttle: konteineriai efemeriški ir
 * skaliojami paraleliai, todėl Map/counter atskiruose instance'uose
 * nesikalbėtų. Upstash Redis REST API leidžia dalintis būsena tarp visų.
 *
 * ELGSENA:
 *  - Env vars (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`):
 *      • Nustatyti → limiter'is aktyvus
 *      • Tušti (dev) → no-op: visos užklausos praeina (result.success = true)
 *  - Upstash klaida:
 *      • Fail-open limiter'iai (`booking`, `availability`, `voucher`, `promo`)
 *        → praleidžia užklausą + logina warning'ą
 *      • Fail-closed limiter'iai (`adminLogin`)
 *        → atmeta užklausą (429), kad brute-force per outage'ą būtų neįmanoma
 *  - Env vars tušti PRODUCTION režime + fail-closed limiter'is → visada atmeta
 *
 * KLIENTO IDENTIFIKAVIMAS: `x-forwarded-for` pirmas įrašas (Vercel Edge visada
 * jį prideda pirmas su tikruoju kliento IP; likusieji — tarpinių proxy chain'as).
 * `x-real-ip` naudojam kaip fallback'ą, „unknown" — kaip paskutinį (kad tokie
 * requests nebūtų neriboti, bet visi bendrai dalintųsi vienu bucket'u).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL || "";
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || "";
const IS_PROD = process.env.NODE_ENV === "production";

/** true kai galim naudoti Upstash (abu env vars nustatyti). */
export function rateLimitConfigured(): boolean {
  return !!(REDIS_URL && REDIS_TOKEN);
}

/** Vienas dalinamas Redis klientas — teiktinas kartotinai. Lazy init. */
let sharedRedis: Redis | null = null;
function redis(): Redis {
  if (!sharedRedis) {
    sharedRedis = new Redis({ url: REDIS_URL, token: REDIS_TOKEN });
  }
  return sharedRedis;
}

/** Sliding window limiter'is su cache — po pirmo naudojimo per lambdą reuse'inam. */
function makeLimiter(prefix: string, limit: number, windowSec: number): Ratelimit {
  return new Ratelimit({
    redis: redis(),
    limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
    prefix: `bala:rl:${prefix}`,
    analytics: false,
  });
}

const limiters: Record<string, Ratelimit | null> = {};
function limiterFor(name: string, limit: number, windowSec: number): Ratelimit | null {
  if (!rateLimitConfigured()) return null;
  if (!limiters[name]) limiters[name] = makeLimiter(name, limit, windowSec);
  return limiters[name];
}

/**
 * Ištraukia kliento IP iš Vercel proxy headers.
 * Vercel Edge visada prideda `x-forwarded-for` su tikruoju kliento IP kaip
 * pirmu įrašu (o ne rewrite'inamu HTTP header'iu iš vartotojo — tie nepasiekia
 * mūsų funkcijos, nes Edge juos perrašo). Prieš tai naudojam `x-real-ip` kaip
 * antrinį patikros header'į.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export type RateLimitResult = {
  /** Ar užklausą leidžiam pro (true = leidžiam, false = 429). */
  allowed: boolean;
  /** Sekundės iki kito bandymo (Retry-After header'iui). */
  retryAfter: number;
  /** Ar limiter'is buvo aktyvus (false = no-op). */
  active: boolean;
  /** Ar buvo Upstash klaida (informacinis — logging). */
  errored: boolean;
};

type LimiterConfig = {
  name: string;
  limit: number;
  windowSec: number;
  /** fail-closed = atmesti kai negalim patikrinti; fail-open = praleisti. */
  failClosed: boolean;
};

/**
 * Bendras rate limit patikros helper'is.
 *  - No config (env tušti) DEV → grąžina allowed=true (no-op)
 *  - No config PRODUCTION + fail-closed → grąžina allowed=false
 *  - No config PRODUCTION + fail-open → allowed=true (kad public flow'as veiktų)
 *  - Upstash klaida + fail-closed → allowed=false + warning log
 *  - Upstash klaida + fail-open → allowed=true + warning log
 */
async function checkLimit(req: Request, cfg: LimiterConfig): Promise<RateLimitResult> {
  const ip = getClientIp(req);
  const identifier = `${cfg.name}:${ip}`;

  if (!rateLimitConfigured()) {
    if (IS_PROD && cfg.failClosed) {
      console.warn(`[rate-limit] ${cfg.name}: NO CONFIG in production, FAIL-CLOSED rejecting ${ip}`);
      return { allowed: false, retryAfter: cfg.windowSec, active: false, errored: false };
    }
    return { allowed: true, retryAfter: 0, active: false, errored: false };
  }

  const limiter = limiterFor(cfg.name, cfg.limit, cfg.windowSec);
  if (!limiter) {
    // Neturėtų nutikti (rateLimitConfigured tikrino), bet defense-in-depth.
    return {
      allowed: !cfg.failClosed,
      retryAfter: cfg.windowSec,
      active: false,
      errored: true,
    };
  }

  try {
    const { success, reset, reason } = await limiter.limit(identifier);
    // @upstash/ratelimit default'as: po 5s timeout SDK grąžina fake
    // `{ success: true, reason: "timeout" }` — kad public flow'ai išsilaikytų
    // per Upstash outage'ą. Fail-CLOSED limiter'iams tai NESAUGU (admin login
    // praeitų neribotai), todėl atskirai apdorojam timeout būseną kaip
    // upstream failure (ta pati politika, kaip ir thrown exception).
    if (reason === "timeout") {
      console.warn(`[rate-limit] ${cfg.name}: Upstash TIMEOUT, ${cfg.failClosed ? "FAIL-CLOSED" : "FAIL-OPEN"} for ${ip}`);
      return {
        allowed: !cfg.failClosed,
        retryAfter: cfg.windowSec,
        active: true,
        errored: true,
      };
    }
    // `reset` — timestamp (ms) kai window baigsis; paverčiam į sekundes nuo dabar.
    const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return { allowed: success, retryAfter, active: true, errored: false };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`[rate-limit] ${cfg.name}: Upstash error, ${cfg.failClosed ? "FAIL-CLOSED" : "FAIL-OPEN"} for ${ip}: ${msg}`);
    return {
      allowed: !cfg.failClosed,
      retryAfter: cfg.windowSec,
      active: true,
      errored: true,
    };
  }
}

/** Standartinis 429 atsakymas — vienodas visiems endpoint'ams. */
export function tooManyRequestsResponse(retryAfter: number): Response {
  return new Response(
    JSON.stringify({ error: "Per daug bandymų. Bandykite vėliau.", retryAfter }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
      },
    },
  );
}

/* ------------- Konkretūs limiter'iai per endpoint'ą ------------- */

/** Admin login — brute-force apsauga; FAIL-CLOSED. */
export const adminLoginRateLimit = (req: Request) =>
  checkLimit(req, { name: "admin-login", limit: 5, windowSec: 15 * 60, failClosed: true });

/** Booking POST — spam apsauga; FAIL-OPEN (klientas turi galėti rezervuoti). */
export const bookingCreateRateLimit = (req: Request) =>
  checkLimit(req, { name: "booking-create", limit: 5, windowSec: 15 * 60, failClosed: false });

/** Voucher POST — spam apsauga; FAIL-OPEN. */
export const voucherCreateRateLimit = (req: Request) =>
  checkLimit(req, { name: "voucher-create", limit: 5, windowSec: 15 * 60, failClosed: false });

/** Voucher validate — dictionary attack apsauga; FAIL-OPEN. */
export const voucherValidateRateLimit = (req: Request) =>
  checkLimit(req, { name: "voucher-validate", limit: 20, windowSec: 5 * 60, failClosed: false });

/** Promo validate — dictionary attack apsauga; FAIL-OPEN. */
export const promoValidateRateLimit = (req: Request) =>
  checkLimit(req, { name: "promo-validate", limit: 20, windowSec: 5 * 60, failClosed: false });

/** Availability GET — enumeracija/spam apsauga; FAIL-OPEN. */
export const availabilityRateLimit = (req: Request) =>
  checkLimit(req, { name: "availability", limit: 60, windowSec: 60, failClosed: false });
