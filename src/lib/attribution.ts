/**
 * REKLAMOS ATRIBUCIJA — iš kur atėjo klientas (UTM žymės, Meta/Google paspaudimas).
 * ─────────────────────────────────────────────────────────────────
 * Kliento pusė: nusileidimo metu nuskaitom UTM parametrus, išorinį referrer'į ir
 * paspaudimo ID (fbclid/gclid). UTM + referrer nėra asmens duomenys — saugom
 * sessionStorage (tik šios sesijos). `fbclid` reikšmė laikoma tik atmintyje ir
 * į sessionStorage rašoma TIK po slapukų sutikimo; `fbc`/`fbp` į serverį
 * siunčiami tik su sutikimu.
 *
 * Serverio pusė: `sanitizeAttribution` išvalo kliento duomenis ir (tik su
 * sutikimu) prideda IP + user agent — jie keliauja į Meta CAPI Purchase eventą.
 */
import { CONSENT_KEY } from "./analytics";

export type Attribution = {
  source?: string; // utm_source arba išvestas: "meta" (fbclid), "google" (gclid), referrer domenas
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
  referrer?: string; // išorinio referrer'io domenas
  landing?: string; // nusileidimo puslapio kelias
  consent?: boolean; // ar vartotojas sutiko su reklamos slapukais
  fbc?: string; // Meta paspaudimo ID (fb.1.<ms>.<fbclid>) — tik su sutikimu
  fbp?: string; // Meta naršyklės ID (_fbp slapukas) — tik su sutikimu
  client_ip?: string; // prideda serveris, tik su sutikimu
  client_ua?: string; // prideda serveris, tik su sutikimu
};

type Touch = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  click?: "meta" | "google";
  referrer?: string;
  landing?: string;
  fbclid?: string; // tik po sutikimo
  ts: number;
};

const STORAGE_KEY = "bala-attribution";
const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

/* fbclid be sutikimo laikomas tik atmintyje (išlieka per Next.js kliento navigaciją). */
let pendingFbclid: { value: string; ts: number } | null = null;

function consentGranted(): boolean {
  try {
    return localStorage.getItem(CONSENT_KEY) === "granted";
  } catch {
    return false;
  }
}

function readTouch(): Touch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Touch) : null;
  } catch {
    return null;
  }
}

function writeTouch(t: Touch): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(t));
  } catch {}
}

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : undefined;
}

/**
 * Kviečiama vieną kartą užsikrovus puslapiui. Naujas reklaminis / išorinis
 * apsilankymas perrašo ankstesnį (paskutinis ne tiesioginis šaltinis sesijoje).
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;
  const params = new URLSearchParams(window.location.search);
  const now = Date.now();

  const touch: Touch = { ts: now, landing: window.location.pathname };
  for (const k of UTM_KEYS) {
    const v = params.get(k);
    if (v) touch[k] = v.slice(0, 200);
  }
  const fbclid = params.get("fbclid");
  const gclid = params.get("gclid");
  if (fbclid) touch.click = "meta";
  else if (gclid) touch.click = "google";

  try {
    if (document.referrer) {
      const host = new URL(document.referrer).hostname;
      if (host && host !== window.location.hostname) touch.referrer = host;
    }
  } catch {}

  if (fbclid) {
    pendingFbclid = { value: fbclid.slice(0, 500), ts: now };
    if (consentGranted()) touch.fbclid = pendingFbclid.value;
  }

  const isNewTouch = UTM_KEYS.some((k) => touch[k]) || touch.click || touch.referrer;
  if (isNewTouch || !readTouch()) writeTouch(touch);
}

/** Kviečiama paspaudus „Sutinku" — išsaugom atmintyje laikytą fbclid. */
export function onAdConsentGranted(): void {
  if (typeof window === "undefined" || !pendingFbclid) return;
  const t = readTouch();
  if (t && t.click === "meta" && !t.fbclid) writeTouch({ ...t, fbclid: pendingFbclid.value });
}

/** Atribucija, siunčiama kartu su rezervacijos / kupono užsakymu. */
export function getAttributionForSubmit(): Attribution | undefined {
  if (typeof window === "undefined") return undefined;
  const t = readTouch();
  const consent = consentGranted();
  const out: Attribution = { consent };
  if (t) {
    out.source = t.utm_source ?? t.click ?? t.referrer;
    out.medium = t.utm_medium;
    out.campaign = t.utm_campaign;
    out.content = t.utm_content;
    out.term = t.utm_term;
    out.referrer = t.referrer;
    out.landing = t.landing;
  }
  if (consent) {
    out.fbp = readCookie("_fbp");
    const fbclid = t?.fbclid ?? pendingFbclid?.value;
    const ts = t?.fbclid ? t.ts : pendingFbclid?.ts;
    out.fbc = readCookie("_fbc") ?? (fbclid && ts ? `fb.1.${ts}.${fbclid}` : undefined);
  }
  return out;
}

/* ============ Serverio pusė ============ */

const STRING_KEYS = ["source", "medium", "campaign", "content", "term", "referrer", "landing"] as const;

/** Išvalo kliento atsiųstą atribuciją; su sutikimu prideda IP ir user agent. */
export function sanitizeAttribution(raw: unknown, req: Request): Attribution | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const out: Attribution = {};
  for (const k of STRING_KEYS) {
    const v = r[k];
    if (typeof v === "string" && v.trim()) out[k] = v.trim().slice(0, 200);
  }
  if (r.consent === true) {
    out.consent = true;
    if (typeof r.fbc === "string" && /^fb\.\d\.\d+\.[\w-]{1,500}$/.test(r.fbc)) out.fbc = r.fbc;
    if (typeof r.fbp === "string" && /^fb\.\d\.\d+\.\d+$/.test(r.fbp)) out.fbp = r.fbp;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "";
    if (ip) out.client_ip = ip.slice(0, 64);
    const ua = req.headers.get("user-agent");
    if (ua) out.client_ua = ua.slice(0, 400);
  } else {
    out.consent = false;
  }
  return Object.keys(out).length > 1 ? out : null;
}
