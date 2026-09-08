/**
 * Rezervacijų priminimo laiškai.
 *
 * - Trys šablonai (po vieną kiekvienai paslaugai): "room" | "game" | "party".
 * - Saugoma esamoje `blackouts` lentelėje per sentinel eilutes — jokių migracijų.
 * - Cron endpoint (/api/cron/reminders) kviečia sendDueReminders() kartą per parą.
 * - Šablone palaikomi placeholder'iai: {{name}}, {{date}}, {{time}}, {{players}},
 *   {{service}}, {{reference}}, {{total}}, {{deposit}}, {{on_site}}.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { dbConfigured } from "@/lib/admin/auth";
import { getPartyPackage } from "@/lib/booking/packages";
import { formatEur } from "@/lib/booking/pricing";
import { emailConfigured, getTransporter, senderAddress } from "@/lib/email";

export type BookingType = "room" | "game" | "party";
export const BOOKING_TYPES: BookingType[] = ["room", "game", "party"];
export const BOOKING_TYPE_LABEL: Record<BookingType, string> = {
  room: "Pabėgimo kambariai",
  game: "VR veiksmo žaidimai",
  party: "Gimtadieniai",
};

export type ReminderTemplate = {
  enabled: boolean;
  subject: string;
  body_html: string;
};

/* --------------- Numatyti šablonai --------------- */

const COMMON_SUBJECT = "Rytoj laukiam BALA VR 🕶️ ({{date}} · {{time}})";

// Bendri blokai — kad būtų vienas šaltinis dažniausiai keičiamai informacijai.
const HEADER_HTML =
  `<p>Sveiki, {{name}}!</p>\n` +
  `<p>Rytoj laukiame jūsų BALA VR žaidimų erdvėje 🕶️</p>\n\n` +
  `<p style="background:#f3f4f6;border-radius:8px;padding:10px 14px;margin:14px 0">\n` +
  `  <b>Jūsų rezervacija:</b> {{service}} · {{date}} · {{time}} · {{players}} žm.\n` +
  `</p>\n\n`;

const LOCATION_HTML =
  `<p><b>📍 Vieta</b><br/>\n` +
  `PC Green Square (Rimi), Pajūrio g. 5B, Klaipėda, 2 aukštas.<br/>\n` +
  `Durys — šalia įstiklintos restorano terasos.</p>\n\n` +
  `<p><b>🚗 Atvykimas automobiliu</b><br/>\n` +
  `Automobilį galite palikti prekybos centro aikštelėje.<br/>\n` +
  `Įėjimas — per dešinę pastato pusę.</p>\n\n`;

const FOOTER_HTML =
  `<p>Jei kils klausimų ar vėluosite — parašykite arba paskambinkite.</p>\n\n` +
  `<p>Iki smagaus nuotykio virtualioje realybėje!<br/>\n` +
  `<b>BALA VR komanda</b></p>`;

const ROOM_BODY =
  HEADER_HTML +
  `<p><b>🕒 Atvykimas</b><br/>\n` +
  `Kviečiame atvykti pačiu laiku arba 5–10 min. anksčiau — kad ramiai spėtume pasiruošti žaidimui ir aptartume scenarijų.</p>\n\n` +
  `<p><b>🧩 Scenarijus</b><br/>\n` +
  `Konkretų kambario scenarijų pasirinksite atvykę — parodysime, papasakosime, padėsime pasirinkti pagal komandą.</p>\n\n` +
  LOCATION_HTML +
  FOOTER_HTML;

const GAME_BODY =
  HEADER_HTML +
  `<p><b>🕒 Atvykimas</b><br/>\n` +
  `Kviečiame atvykti pačiu laiku arba iki 15 min. anksčiau — kad ramiai spėtume pasiruošti įrangą.</p>\n\n` +
  `<p><b>👕 Apranga</b><br/>\n` +
  `Rekomenduojame patogią, laisvą aprangą — žaidimas aktyvus, judėsite ir sukiositės po visą erdvę.</p>\n\n` +
  LOCATION_HTML +
  FOOTER_HTML;

const PARTY_BODY =
  HEADER_HTML +
  `<p><b>🕒 Atvykimas</b><br/>\n` +
  `Kviečiame atvykti pačiu laiku arba iki 15 min. anksčiau — kad ramiai spėtume pasiruošti šventei.</p>\n\n` +
  `<p><b>⏱ Dėl laiko</b><br/>\n` +
  `Pasibaigus rezervuotam laikui rezervaciją galima <b>prasitęsti 15 min.</b> (jei tuo metu yra galimybė — sutariame vietoje, papildomas laikas apmokamas).<br/>\n` +
  `Kitu atveju prašome išvykti laiku — vėlavimas be susitarimo apmokestinamas pagal galiojančius įkainius.</p>\n\n` +
  LOCATION_HTML +
  FOOTER_HTML;

export const DEFAULT_TEMPLATES: Record<BookingType, ReminderTemplate> = {
  room:  { enabled: true, subject: COMMON_SUBJECT, body_html: ROOM_BODY },
  game:  { enabled: true, subject: COMMON_SUBJECT, body_html: GAME_BODY },
  party: { enabled: true, subject: COMMON_SUBJECT, body_html: PARTY_BODY },
};

export const PLACEHOLDERS = [
  "name", "date", "time", "players", "service",
  "reference", "total", "deposit", "on_site",
] as const;

/* --------------- Šablonų saugojimas (sentinel eilutės blackouts lentelėje) --------------- */

export const TEMPLATE_SENTINEL_DATE = "1900-01-01";
export const SENT_SENTINEL_DATE = "1900-01-02";
export const SENTINEL_DATE_CUTOFF = "2000-01-01"; // viskas ankstesnis = sistemos sentinel

function templateSentinelTime(type: BookingType): string {
  return `TMPL:REMINDER:${type}`;
}

export async function loadTemplate(type: BookingType): Promise<ReminderTemplate> {
  const fallback = DEFAULT_TEMPLATES[type];
  if (!dbConfigured()) return fallback;
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("blackouts")
      .select("reason")
      .eq("date", TEMPLATE_SENTINEL_DATE)
      .eq("time", templateSentinelTime(type))
      .maybeSingle();
    if (error) throw error;
    if (!data?.reason) return fallback;
    const v = JSON.parse(data.reason as string) as Partial<ReminderTemplate>;
    return {
      enabled: typeof v.enabled === "boolean" ? v.enabled : fallback.enabled,
      subject: typeof v.subject === "string" && v.subject.trim() ? v.subject : fallback.subject,
      body_html: typeof v.body_html === "string" && v.body_html.trim() ? v.body_html : fallback.body_html,
    };
  } catch (e) {
    console.warn(`[reminder] loadTemplate(${type}) fallback:`, e instanceof Error ? e.message : e);
    return fallback;
  }
}

export async function loadAllTemplates(): Promise<Record<BookingType, ReminderTemplate>> {
  const entries = await Promise.all(
    BOOKING_TYPES.map(async (t) => [t, await loadTemplate(t)] as const),
  );
  return Object.fromEntries(entries) as Record<BookingType, ReminderTemplate>;
}

export async function saveTemplate(type: BookingType, t: ReminderTemplate): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const time = templateSentinelTime(type);
  await supabase
    .from("blackouts")
    .delete()
    .eq("date", TEMPLATE_SENTINEL_DATE)
    .eq("time", time);
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: TEMPLATE_SENTINEL_DATE, time, reason: JSON.stringify(t) });
  if (error) throw error;
}

/* --------------- Render'inimas --------------- */

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
const WEEKDAYS = ["Sekmadienis","Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis"];
/** B formatas: „Šeštadienis, rugsėjo 12" (be „d.", su didžiąja raide). Prie tikros datos + laikas eina po " · ". */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd}, ${MONTHS[m - 1]} ${d}`;
}
function serviceName(b: BookingRow): string {
  if (b.type === "party") {
    const pkg = getPartyPackage(b.package_id ?? "");
    return pkg ? `Gimtadienio paketas ${pkg.name}` : "Gimtadienio šventė";
  }
  if (b.type === "game") return "VR veiksmo žaidimai";
  return "VR pabėgimo kambarys";
}

function bookingType(b: BookingRow): BookingType {
  if (b.type === "party") return "party";
  if (b.type === "game") return "game";
  return "room";
}

type Vars = Record<(typeof PLACEHOLDERS)[number], string>;

function bookingVars(b: BookingRow): Vars {
  const total = Number(b.total_eur);
  const dep = Number(b.deposit_eur);
  const voucher = Number(b.voucher_discount_eur || 0);
  const onSite = Math.max(0, total - voucher - dep);
  return {
    name: b.customer_name,
    date: fmtDate(b.date),
    time: b.time,
    players: String(b.players),
    service: serviceName(b),
    reference: b.merchant_reference,
    total: formatEur(total),
    deposit: formatEur(dep),
    on_site: formatEur(onSite),
  };
}

function sampleVars(type: BookingType): Vars {
  const service = type === "party" ? "Gimtadienio paketas Maxi"
    : type === "game" ? "VR veiksmo žaidimai"
    : "VR pabėgimo kambarys";
  return {
    name: "Vardenis Pavardenis",
    date: fmtDate(new Date(Date.now() + 86400000).toISOString().slice(0, 10)),
    time: "16:30",
    players: type === "party" ? "11" : "4",
    service,
    reference: "BALA-ABC123",
    total: type === "party" ? "219,00" : "80,00",
    deposit: type === "party" ? "50,00" : "30,00",
    on_site: type === "party" ? "169,00" : "50,00",
  };
}

/** Pakeičia {{key}} pagal duotus kintamuosius (nežinomi palieka {{name}} kaip yra). */
export function renderTemplate(tmpl: string, vars: Partial<Vars>): string {
  return tmpl.replace(/\{\{\s*(\w+)\s*\}\}/g, (m, k) => {
    const v = (vars as Record<string, string>)[k];
    return typeof v === "string" ? v : m;
  });
}

/* --------------- HTML „shell" --------------- */
function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#111827;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px;font-weight:700;font-size:18px;letter-spacing:.02em">BALA <span style="color:#4db8cc">VR</span></div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:22px;font-size:14px;line-height:1.5">
      ${inner}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0">BALA VR · Pajūrio g. 5B, Klaipėda · +370 684 26686</p>
  </div></body></html>`;
}

/* --------------- Siuntimas --------------- */

export async function sendDueReminders(opts: { dryRun?: boolean } = {}): Promise<{
  candidates: number;
  sent: number;
  failed: number;
  skipped_reason?: string;
}> {
  if (!dbConfigured()) return { candidates: 0, sent: 0, failed: 0, skipped_reason: "db_not_configured" };
  if (!emailConfigured()) return { candidates: 0, sent: 0, failed: 0, skipped_reason: "email_not_configured" };

  const templates = await loadAllTemplates();

  const tomorrow = tomorrowVilniusISO();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "paid")
    .eq("date", tomorrow);
  if (error) throw error;

  const rows = (data ?? []) as BookingRow[];
  if (rows.length === 0) return { candidates: 0, sent: 0, failed: 0 };

  const { data: sentRows } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", SENT_SENTINEL_DATE)
    .in("time", rows.map((b) => b.id));
  const alreadySent = new Set((sentRows ?? []).map((r) => r.time as string));

  // Filtruojam ir jau siųstus, ir tuos, kurių tipo šablonas išjungtas.
  const pending = rows.filter((b) => {
    if (alreadySent.has(b.id)) return false;
    const tmpl = templates[bookingType(b)];
    return tmpl.enabled;
  });

  if (opts.dryRun) return { candidates: pending.length, sent: 0, failed: 0, skipped_reason: "dry_run" };

  let sent = 0, failed = 0;
  for (const b of pending) {
    try {
      const tmpl = templates[bookingType(b)];
      await sendOneReminder(b, tmpl);
      await supabase
        .from("blackouts")
        .insert({ date: SENT_SENTINEL_DATE, time: b.id, reason: new Date().toISOString() });
      sent++;
    } catch (e) {
      failed++;
      console.error(`[reminder] KLAIDA ${b.merchant_reference}:`, e);
    }
  }
  return { candidates: pending.length, sent, failed };
}

async function sendOneReminder(b: BookingRow, tmpl: ReminderTemplate): Promise<void> {
  const vars = bookingVars(b);
  const subject = renderTemplate(tmpl.subject, vars);
  const html = shell(renderTemplate(tmpl.body_html, vars));
  await getTransporter().sendMail({
    from: senderAddress(),
    to: b.customer_email,
    subject,
    html,
  });
  console.log(`[reminder] OK -> ${b.customer_email} (${b.merchant_reference})`);
}

/** Bandymo laiškas: renderina šabloną pagal paslaugos tipą ir siunčia į duotą adresą. */
export async function sendTestReminder(
  to: string, type: BookingType, tmpl?: ReminderTemplate,
): Promise<void> {
  if (!emailConfigured()) throw new Error("El. paštas nesukonfigūruotas (GMAIL_USER / GMAIL_APP_PASSWORD)");
  const t = tmpl ?? (await loadTemplate(type));
  const vars = sampleVars(type);
  const subject = "[BANDYMAS] " + renderTemplate(t.subject, vars);
  const html = shell(renderTemplate(t.body_html, vars));
  await getTransporter().sendMail({ from: senderAddress(), to, subject, html });
}

/* --------------- Data (Europe/Vilnius) --------------- */

/** Rytojaus data „YYYY-MM-DD" pagal Europe/Vilnius laiko juostą. */
export function tomorrowVilniusISO(): string {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Vilnius",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(now.getTime() + 24 * 3600 * 1000));
  const y = parts.find((p) => p.type === "year")!.value;
  const m = parts.find((p) => p.type === "month")!.value;
  const d = parts.find((p) => p.type === "day")!.value;
  return `${y}-${m}-${d}`;
}
