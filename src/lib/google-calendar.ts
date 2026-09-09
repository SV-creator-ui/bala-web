/**
 * Google Calendar integracija — RAŠYMAS į verslo kalendorių (service account).
 * Apmokėta rezervacija tampa įvykiu; perkėlimas/atšaukimas jį atnaujina/ištrina.
 *
 * TIK serveriui. Autentifikacija: service account JWT (RS256) -> OAuth2 access
 * token -> Google Calendar REST API. Naudojame `jose` (be sunkios googleapis).
 *
 * Reikalingi aplinkos kintamieji (žr. .env.local.example):
 *   GOOGLE_CALENDAR_ID   – kalendoriaus ID (dažnai el. paštas), su kuriuo
 *                          pasidalinta su service account (teisė „Keisti įvykius")
 *   GOOGLE_SA_EMAIL      – service account el. paštas
 *   GOOGLE_SA_PRIVATE_KEY– service account privatus raktas (PEM, PKCS8)
 */
import { SignJWT, importPKCS8 } from "jose";
import type { BookingRow } from "@/lib/supabase/server";
import { getPartyPackage } from "@/lib/booking/packages";
import { formatEur } from "@/lib/booking/pricing";

const TIME_ZONE = "Europe/Vilnius";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPE = "https://www.googleapis.com/auth/calendar.events";

function calendarId(): string {
  return process.env.GOOGLE_CALENDAR_ID || "";
}
function saEmail(): string {
  return process.env.GOOGLE_SA_EMAIL || "";
}
function saPrivateKey(): string {
  // .env laiko su literaliais \n — paverčiame tikrais eilučių pabaigos ženklais.
  return (process.env.GOOGLE_SA_PRIVATE_KEY || "").replace(/\\n/g, "\n");
}

/** Ar Google Calendar sukonfigūruotas (galima rašyti įvykius). */
export function googleCalendarConfigured(): boolean {
  return !!(calendarId() && saEmail() && saPrivateKey());
}

/* ------------------------- OAuth2 access token ------------------------- */
let cachedToken: { token: string; exp: number } | null = null;

async function getAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.exp - 60 > now) return cachedToken.token;

  const key = await importPKCS8(saPrivateKey(), "RS256");
  const assertion = await new SignJWT({ scope: SCOPE })
    .setProtectedHeader({ alg: "RS256", typ: "JWT" })
    .setIssuer(saEmail())
    .setSubject(saEmail())
    .setAudience(TOKEN_URL)
    .setIssuedAt(now)
    .setExpirationTime(now + 3600)
    .sign(key);

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    throw new Error(`Google token klaida (${res.status}): ${await res.text().catch(() => "")}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, exp: now + data.expires_in };
  return data.access_token;
}

/* ------------------------- Įvykio turinys ------------------------- */
function pad(hhmm: string): string {
  return hhmm.length === 5 ? `${hhmm}:00` : hhmm; // "17:30" -> "17:30:00"
}

function eventBody(b: BookingRow) {
  // Kalendoriaus įvykis atspindi realią seanso pradžią (`b.time`), o ne salės
  // paruošimo pradžią (`b.block_start`). Pabaigai naudojam salės atlaisvinimo
  // laiką (`b.block_end`), nes tai realus laikas, kai salė vėl laisva.
  const start = b.time;
  const end = b.block_end ?? b.time;
  const isParty = b.type === "party";
  const pkg = isParty ? getPartyPackage(b.package_id ?? "") : undefined;

  const isGame = b.type === "game";
  // Gimtadienio pavadinime pirmiausia rodom jubiliatą (jei žinomas iš kvietimo)
  // — kad kalendoriuje iš karto matytųsi, kieno šventė ir kiek jam metų.
  const celebrantLabel =
    isParty && b.celebrant_name
      ? ` ${b.celebrant_name}${b.celebrant_age ? ` (${b.celebrant_age} m.)` : ""}`
      : "";
  const summary = isParty
    ? `🎂 Gimtadienis${celebrantLabel} — ${b.customer_name}${pkg ? ` · ${pkg.name}` : ""} (${b.players} asm.)`
    : isGame
    ? `🎮 VR veiksmo žaidimai — ${b.customer_name} (${b.players} asm.)`
    : `🥽 VR kambarys — ${b.customer_name} (${b.players} asm.)`;

  // Jei salės paruošimo laikas skiriasi nuo seanso pradžios — parodom tai
  // aprašyme, kad būtų aišku, kada personalas turi pradėti ruoštis.
  const setupNote =
    b.block_start && b.block_start !== b.time
      ? `Salė užimta: ${b.block_start}–${b.block_end ?? b.time} (paruošimas ${b.block_start})`
      : null;

  // Jubiliato eilutė aprašyme — kad būtų aišku, kieno gimtadienis (net jei
  // pavadinime jau matoma) ir amžius. Rodom tik jei bent vardas žinomas.
  const celebrantLine =
    isParty && b.celebrant_name
      ? `Jubiliatas: ${b.celebrant_name}${b.celebrant_age ? ` — ${b.celebrant_age} m.` : ""}`
      : null;

  const lines = [
    isParty ? `Paketas: ${pkg ? pkg.name : "šventė"}` : isGame ? "VR veiksmo žaidimai" : "VR pabėgimo kambarys",
    celebrantLine,
    `Klientas: ${b.customer_name}`,
    `Tel.: ${b.customer_phone}`,
    `El. paštas: ${b.customer_email}`,
    `Dalyviai: ${b.players}`,
    `Suma: ${formatEur(Number(b.total_eur))} € (avansas ${formatEur(Number(b.deposit_eur))} €)`,
    setupNote,
    b.note ? `Pastaba: ${b.note}` : null,
    `Nr.: ${b.merchant_reference}`,
  ].filter(Boolean);

  return {
    summary,
    description: lines.join("\n"),
    location: "BALA VR, Pajūrio g. 5B, Klaipėda",
    start: { dateTime: `${b.date}T${pad(start)}`, timeZone: TIME_ZONE },
    end: { dateTime: `${b.date}T${pad(end)}`, timeZone: TIME_ZONE },
  };
}

/* ------------------------- Viešos operacijos ------------------------- */

/**
 * Sukuria (arba atnaujina, jei `b.gcal_event_id` yra) kalendoriaus įvykį.
 * Grąžina įvykio id arba null (jei nesukonfigūruota / klaida).
 */
export async function syncBookingEvent(b: BookingRow): Promise<string | null> {
  if (!googleCalendarConfigured()) return null;
  const token = await getAccessToken();
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`;
  const body = JSON.stringify(eventBody(b));

  if (b.gcal_event_id) {
    const res = await fetch(`${base}/${encodeURIComponent(b.gcal_event_id)}`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body,
    });
    if (res.ok) return b.gcal_event_id;
    if (res.status !== 404) throw new Error(`Google Calendar PATCH ${res.status}: ${await res.text().catch(() => "")}`);
    // 404 — įvykis dingęs; sukuriame naują (kris žemiau).
  }

  const res = await fetch(base, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`Google Calendar POST ${res.status}: ${await res.text().catch(() => "")}`);
  const data = (await res.json()) as { id: string };
  return data.id;
}

/* ------------------------- Įvykių skaitymas ------------------------- */

/**
 * Užimtas kalendoriaus intervalas konkretaus tipo tikslams.
 * Skirta perkelti Moizmo (ar rankiniu būdu įrašytus) įvykius į prieinamumo
 * tikrintuvą, kad nauji klientai negalėtų rezervuoti to paties laiko.
 */
export type CalendarBusyInterval = {
  startMin: number; // minutės nuo dienos pradžios (Vilniaus laiko juosta)
  endMin: number;
  eventId: string;
  summary: string;
};

/** Skaido ISO 8601 datą (bet kokia laiko juosta) į Vilniaus vietinę datą + minutes. */
function toVilniusDateAndMin(iso: string): { date: string; min: number } | null {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return null;
    // sv-SE formatuoja kaip YYYY-MM-DD HH:MM — patogu parsinti
    const fmt = new Intl.DateTimeFormat("sv-SE", {
      timeZone: TIME_ZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hour12: false,
    });
    const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value]));
    const date = `${parts.year}-${parts.month}-${parts.day}`;
    const min = parseInt(parts.hour, 10) * 60 + parseInt(parts.minute, 10);
    return { date, min };
  } catch {
    return null;
  }
}

/**
 * Grąžina užimtus intervalus konkrečiai datai iš Google Calendar.
 * `excludeEventIds` — savų (jau `bookings` lentelėje esančių) įvykių ID'ai,
 * kad išvengtume dvigubo skaičiavimo.
 * Klaidos — nefatališkos: grąžinam tuščią sąrašą.
 */
export async function fetchCalendarBusyForDate(
  date: string,
  excludeEventIds: Set<string>,
): Promise<CalendarBusyInterval[]> {
  if (!googleCalendarConfigured()) return [];
  try {
    const token = await getAccessToken();
    // Vilnius = UTC+2/+3; UTC±12h dienos rėžis su atsarga (filtruosim vėliau).
    const dayStartUtc = new Date(`${date}T00:00:00Z`);
    const timeMin = new Date(dayStartUtc.getTime() - 12 * 3600_000).toISOString();
    const timeMax = new Date(dayStartUtc.getTime() + 36 * 3600_000).toISOString();

    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events`,
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true"); // išskaido pasikartojančius
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "100");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      // Trumpai cache'inam — kalendorius nesikeičia sekundės greičiu
      next: { revalidate: 30 },
    });
    if (!res.ok) {
      console.error(`Calendar events fetch ${res.status}`);
      return [];
    }
    const data = (await res.json()) as {
      items?: Array<{
        id?: string;
        summary?: string;
        status?: string;
        start?: { dateTime?: string; date?: string };
        end?: { dateTime?: string; date?: string };
      }>;
    };

    const out: CalendarBusyInterval[] = [];
    for (const item of data.items ?? []) {
      if (!item.id || item.status === "cancelled") continue;
      if (excludeEventIds.has(item.id)) continue; // mūsų pačių — praleidžiam
      const startIso = item.start?.dateTime;
      const endIso = item.end?.dateTime;
      if (!startIso || !endIso) continue; // visos-dienos įvykis — ignoruojam

      const s = toVilniusDateAndMin(startIso);
      const e = toVilniusDateAndMin(endIso);
      if (!s || !e) continue;

      // Perkėlimas per naktį — apkarpom į norimą dieną
      let startMin = s.date === date ? s.min : s.date < date ? 0 : -1;
      let endMin = e.date === date ? e.min : e.date > date ? 24 * 60 : -1;
      if (startMin < 0 || endMin < 0 || endMin <= startMin) continue;
      // Kartais end ties pat vidurnakčiu — tokį ignoruojam
      if (endMin === 0) continue;

      out.push({
        startMin,
        endMin,
        eventId: item.id,
        summary: item.summary || "Kalendorius",
      });
    }
    return out;
  } catch (e) {
    console.error("fetchCalendarBusyForDate error:", e);
    return [];
  }
}

/**
 * Grąžina visus kalendorius, prie kurių service account turi prieigą.
 * Diagnostikai — padeda išsiaiškinti, į kurį kalendorių Moizmo iš tiesų rašo.
 */
export async function listAccessibleCalendars(): Promise<
  Array<{ id: string; summary: string; primary: boolean; accessRole: string }>
> {
  if (!googleCalendarConfigured()) return [];
  try {
    const token = await getAccessToken();
    const res = await fetch(
      "https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=100",
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      console.error(`calendarList ${res.status}`);
      return [];
    }
    const data = (await res.json()) as {
      items?: Array<{
        id?: string; summary?: string; primary?: boolean; accessRole?: string;
      }>;
    };
    return (data.items ?? []).map((c) => ({
      id: c.id || "",
      summary: c.summary || "",
      primary: !!c.primary,
      accessRole: c.accessRole || "",
    }));
  } catch (e) {
    console.error("listAccessibleCalendars error:", e);
    return [];
  }
}

/** Ištrina kalendoriaus įvykį (atšaukus rezervaciją). */
export async function deleteBookingEvent(eventId: string): Promise<void> {
  if (!googleCalendarConfigured() || !eventId) return;
  const token = await getAccessToken();
  const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId())}/events/${encodeURIComponent(eventId)}`;
  const res = await fetch(url, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
  // 410/404 — jau ištrintas; laikome sėkme.
  if (!res.ok && res.status !== 404 && res.status !== 410) {
    throw new Error(`Google Calendar DELETE ${res.status}: ${await res.text().catch(() => "")}`);
  }
}
