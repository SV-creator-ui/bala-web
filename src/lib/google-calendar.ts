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
  const start = b.block_start ?? b.time;
  const end = b.block_end ?? b.time;
  const isParty = b.type === "party";
  const pkg = isParty ? getPartyPackage(b.package_id ?? "") : undefined;

  const isGame = b.type === "game";
  const summary = isParty
    ? `🎂 Gimtadienis${pkg ? " " + pkg.name : ""} — ${b.customer_name} (${b.players} asm.)`
    : isGame
    ? `🎮 Komandiniai VR žaidimai — ${b.customer_name} (${b.players} asm.)`
    : `🥽 VR kambarys — ${b.customer_name} (${b.players} asm.)`;

  const lines = [
    isParty ? `Paketas: ${pkg ? pkg.name : "šventė"}` : isGame ? "Komandiniai VR žaidimai" : "VR pabėgimo kambarys",
    `Klientas: ${b.customer_name}`,
    `Tel.: ${b.customer_phone}`,
    `El. paštas: ${b.customer_email}`,
    `Dalyviai: ${b.players}`,
    `Suma: ${formatEur(Number(b.total_eur))} € (avansas ${formatEur(Number(b.deposit_eur))} €)`,
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
