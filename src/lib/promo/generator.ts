/**
 * Automatinis promo kodų generavimas ir laiškų siuntimas (cron).
 *
 * Mechanikos:
 *  1. LOJALUMAS (SUGRIZK-XXX): 30% nuolaida 3-iam vizitui
 *     - Trigger: klientas turi lygiai 2 apmokėtus room/game vizitus per pastarąsias 90 dienų,
 *       ir šiam email dar niekada nebuvo siųstas lojalumo kodas
 *     - Galioja 90 dienų nuo išsiuntimo
 *     - Panaudojimas tik 3-iam+ vizitui (min_visits_required = 2)
 *     - Priminimas likus 15 dienų iki pabaigos
 *
 *  2. PADĖKA UŽ ŠVENTĘ (ACIU-XXX): 20% nuolaida VR pabėgimo kambariui / veiksmo žaidimams
 *     - Trigger: party rezervacija apmokėta, data buvo prieš 3 dienas, dar be padėkos kodo
 *     - Galioja 60 dienų nuo išsiuntimo
 *     - Tinka tik room/game (NE party)
 */
import type { BookingRow } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { dbConfigured } from "@/lib/admin/auth";
import { emailConfigured, getTransporter, senderAddress } from "@/lib/email";
import {
  generateCodeString, insertPromoCode, loyaltyCodeSentTo, markLoyaltySent,
  partyThanksSentFor, markPartyThanksSent, listPromoCodes,
  reminderSentFor, markReminderSent, normalizeEmail,
  visitOneThanksSentTo, markVisitOneThanksSent,
  listUnsubscribed, listHistClients, listRoomClients, anniversarySentFor, markAnniversarySent,
  secondVisitSentTo, markSecondVisitSent, countPaidRoomGameVisits,
  type PromoCode,
} from "./storage";
import { unsubscribeApiUrl, unsubscribePageUrl } from "./unsubscribe";

/* --------------- Datos --------------- */
const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
const WEEKDAYS = ["Sekmadienis","Pirmadienis","Antradienis","Trečiadienis","Ketvirtadienis","Penktadienis","Šeštadienis"];
/** B formatas: „Šeštadienis, rugsėjo 12" — su didžiąja raide, be „d.". */
function fmtDateLT(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return `${wd}, ${MONTHS[m - 1]} ${d}`;
}
function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function addDaysISO(iso: string, days: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/* --------------- HTML shell --------------- */
function shell(inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#111827;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px;font-weight:700;font-size:18px;letter-spacing:.02em">BALA <span style="color:#4db8cc">VR</span></div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:22px;font-size:14px;line-height:1.5">${inner}</div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0">BALA VR · Pajūrio g. 5B, Klaipėda</p>
    <p style="text-align:center;color:#6b7280;font-size:12.5px;margin:10px 0 0">Šį laišką gavote, nes esate BALA VR klientas. Nebenorite gauti pasiūlymų? <a href="{{UNSUB}}" style="color:#374151;text-decoration:underline">Atsisakyti</a></p>
  </div></body></html>`;
}

function codeBadge(code: string): string {
  return `<div style="text-align:center;margin:18px 0">
    <div style="display:inline-block;background:#eefdf6;border:2px dashed #10b981;border-radius:10px;padding:12px 22px;font-family:'Courier New',monospace;font-size:20px;font-weight:700;letter-spacing:.15em;color:#065f46">${code}</div>
  </div>`;
}

/* --------------- Laiškų šablonai (hardkoduoti — nekeičiami per admin) --------------- */

function visitOneThanksEmail(name: string): { subject: string; html: string } {
  const subject = "Ačiū už vizitą BALA VR! 🎁 Turime tau siurprizą";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Ačiū, kad rinkotės BALA VR!</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Ačiū, kad išbandėte BALA VR nuotykius. Tikimės, kad patyrėte adrenalino ir gerų emocijų 🎮</p>` +
    `<div style="background:#f0fdf4;border-left:4px solid #10b981;padding:14px 16px;margin:18px 0;border-radius:6px">` +
      `<p style="margin:0 0 6px;font-weight:700;font-size:15px;color:#065f46">🎁 Dovana tik grįžtantiems</p>` +
      `<p style="margin:0;color:#374151;font-size:13.5px">Ateikite dar <b>du kartus</b> per 90 dienų — <b>trečias vizitas su 30% nuolaida</b> VR pabėgimo kambariui ar veiksmo žaidimams.</p>` +
    `</div>` +
    `<p>Po maždaug 2 savaičių atsiųsime jums <b>asmeninį kodą su 15% nuolaida</b> kitam vizitui. Kai grįšite antrą kartą, atsiųsime ir kodą trečiam vizitui su 30% nuolaida.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>` +
    `<p style="color:#6b7280;font-size:12px">Rezervacija: <a href="https://bala.lt" style="color:#0d9488">bala.lt</a> · Skambink: +370 684 26686</p>`,
  );
  return { subject, html };
}

function loyaltyEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "Ačiū, kad grįžote! 🎁 3-iam vizitui — 30% nuolaida";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Ačiū, kad grįžote!</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Ačiū, kad jau <b>du kartus</b> rinkotės BALA VR nuotykius — norime jums padėkoti.</p>` +
    `<p>Kviečiam <b>trečiam vizitui su 30% nuolaida</b> — bet kuriam VR pabėgimo kambariui ar veiksmo žaidimų seansui.</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 4px;color:#111827"><b>Nuolaida galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p style="text-align:center;margin:0 0 18px;color:#6b7280;font-size:12.5px">(60 dienų nuo šio laiško — turėsite laiko suplanuoti komandą ir sugrįžti)</p>` +
    `<p>Rezervuok <a href="https://bala.lt" style="color:#0d9488">bala.lt</a> ir įvesk kodą apmokėjimo lange.</p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuok tuo pačiu el. paštu, kuriuo gavai laišką. Nuolaida nesikaupia su dovanų kuponais.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>`,
  );
  return { subject, html };
}

export function partyThanksEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "Ačiū už šventę BALA VR 🎉";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Ačiū už šventę!</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Ačiū, kad šventėte pas mus BALA VR! ❤️ Mums buvo labai malonu būti Jūsų šventės dalimi.</p>` +
    `<p style="margin-bottom:4px">Kaip padėką norime padovanoti Jums</p>` +
    `<p style="text-align:center;margin:6px 0 14px;font-size:26px;line-height:1.25;font-weight:800;color:#0d2b35">20% nuolaidą VR pabėgimo kambariui</p>` +
    `<p>Pasikvieskite draugus ar šeimą ir grįžkite dar vienam nuotykiui! 🥽</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 4px;color:#111827"><b>Nuolaida galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p style="text-align:center;margin:0 0 18px;color:#6b7280;font-size:12.5px">(60 dienų nuo šio laiško)</p>` +
    `<p>Rezervuokite <a href="https://bala.lt/rezervacija?utm_source=email&utm_medium=promo&utm_campaign=aciu" style="color:#0d9488">www.bala.lt</a> ir įveskite nuolaidos kodą apmokėjimo lange.</p>` +
    `<p style="text-align:center;margin:20px 0"><a href="https://bala.lt/rezervacija?utm_source=email&utm_medium=promo&utm_campaign=aciu" style="display:inline-block;background:#f0a500;color:#0d2b35;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px">REZERVUOTI</a></p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuokite tuo pačiu el. paštu, kuriuo gavote laišką. Nuolaida nesisumuoja su dovanų kuponais.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>`,
  );
  return { subject, html };
}

function loyaltyReminderEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "⏳ Liko 15 dienų pasinaudoti 30% nuolaida";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Kodo galiojimas baigiasi</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Primename, kad jūsų lojalumo kodas su <b>30% nuolaida</b> baigia galioti po 15 dienų. Nepraleiskite progos grįžti į BALA VR nuotykius.</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 18px;color:#111827"><b>Galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p>Rezervuok <a href="https://bala.lt" style="color:#0d9488">bala.lt</a> ir įvesk kodą apmokėjimo lange.</p>` +
    `<p>BALA VR komanda</p>`,
  );
  return { subject, html };
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

/** Siunčia rinkodaros laišką: įdeda atsisakymo nuorodą ir List-Unsubscribe antraštes. */
async function sendPromoMail(to: string, subject: string, html: string): Promise<void> {
  const page = unsubscribePageUrl(to);
  await getTransporter().sendMail({
    from: senderAddress(),
    to,
    subject,
    html: html.replace("{{UNSUB}}", page),
    headers: {
      "List-Unsubscribe": `<${unsubscribeApiUrl(to)}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    },
  });
}

/** Naujos kampanijos įjungiamos aplinkos kintamuoju (dry-run veikia visada). */
function flagOn(name: string): boolean {
  return process.env[name] === "1";
}

function pad2(n: number): string { return String(n).padStart(2, "0"); }
function isLeap(y: number): boolean { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
function daysBetweenISO(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000);
}

/**
 * Artimiausios metinės PO paskutinės šventės: paskutinė šventės data + N metų (N ≥ 1),
 * pirmoji, kuri ≥ šiandien. Taip būsima (jau užsakyta) šventė kitų metų laiško neiššaukia
 * anksčiau laiko. Vasario 29 d. metinėms nenuosekliais metais — vasario 28 d.
 */
export function nextAnniversary(lastPartyISO: string, todayIso: string): string {
  const [y, m, d] = lastPartyISO.split("-").map(Number);
  for (let n = 1; n <= 15; n++) {
    const yy = y + n;
    const dd = m === 2 && d === 29 && !isLeap(yy) ? 28 : d;
    const iso = `${yy}-${pad2(m)}-${pad2(dd)}`;
    if (iso >= todayIso) return iso;
  }
  return `${y + 15}-${pad2(m)}-${pad2(d)}`;
}

/** Laiškas išsiunčiamas, kai iki metinių lieka nuo ANNIV_MIN iki ANNIV_MAX dienų (2–5 savaitės). */
export const ANNIV_MIN_DAYS = 14;
export const ANNIV_MAX_DAYS = 35;


export function anniversaryEmail(opts: {
  name: string; code: string; validUntil: string; celebrant?: string; nextAge?: number;
}): { subject: string; html: string } {
  const hasChild = !!opts.celebrant && !!opts.nextAge;
  const subject = hasChild
    ? `${opts.celebrant} kitąmet sukaks ${opts.nextAge} m. — rezervuokite šventę BALA VR`
    : "Artėja gimtadienis? −19 € jūsų šventei BALA VR";
  const link = "https://bala.lt/gimtadieniai/rezervacija?utm_source=email&utm_medium=promo&utm_campaign=metines";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">${hasChild ? `${escapeHtml(opts.celebrant!)} kitąmet sukaks ${opts.nextAge} m.` : "Artėja dar vienas gimtadienis?"}</h2>` +
    `<p>Sveiki, ${escapeHtml(opts.name)}!</p>` +
    `<p>Ačiū, kad šventėte pas mus BALA VR. ${hasChild ? "Jei ir šiais metais planuojate šventę," : "Jei planuojate gimtadienio šventę,"} <b>savaitgaliai užsipildo 2–3 savaitės iš anksto</b> — geriausia datą rezervuoti jau dabar.</p>` +
    `<p>Kaip padėka grįžtantiems — <b>19 € nuolaida</b> gimtadienio šventei (galioja ir savaitgaliais):</p>` +
    codeBadge(opts.code) +
    `<p style="text-align:center;margin:0 0 18px;color:#111827"><b>Kodas galioja iki ${fmtDateLT(opts.validUntil)}</b></p>` +
    `<p>Pirmadienį–ketvirtadienį dar papildomai taikoma <b>−20 € nuolaida</b> (pritaikoma automatiškai).</p>` +
    `<p style="text-align:center;margin:20px 0"><a href="${link}" style="display:inline-block;background:#f0a500;color:#0d2b35;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px">REZERVUOTI ŠVENTĘ</a></p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuokite tuo pačiu el. paštu, kuriuo gavote laišką. Nesikaupia su dovanų kuponais. Įveskite jį apmokėjimo žingsnyje.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>`,
  );
  return { subject, html };
}

export function secondVisitEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "Dar vienas nuotykis BALA VR? −15% jūsų kitam vizitui 🎮";
  const link = "https://bala.lt/rezervacija?utm_source=email&utm_medium=promo&utm_campaign=antras-vizitas";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Ačiū, kad aplankėte BALA VR!</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Prieš porą savaičių išbandėte BALA VR. Dovanojame <b>15% nuolaidą</b> kitam vizitui — VR pabėgimo kambariui ar veiksmo žaidimams:</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 18px;color:#111827"><b>Kodas galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p style="text-align:center;margin:20px 0"><a href="${link}" style="display:inline-block;background:#f0a500;color:#0d2b35;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px">REZERVUOTI</a></p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuokite tuo pačiu el. paštu, kuriuo gavote laišką. Nesikaupia su dovanų kuponais. Įveskite jį apmokėjimo žingsnyje.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>`,
  );
  return { subject, html };
}

/* --------------- Trigger'iai (cron) --------------- */

export type PromoRunResult = {
  visit_one_thanks_sent: number;
  loyalty_sent: number;
  party_thanks_sent: number;
  reminders_sent: number;
  anniversary_sent: number;
  second_visit_sent: number;
  errors: number;
  skipped_reason?: string;
  /** Tik dry-run: kam ir ką būtų išsiųsta (el. paštai užmaskuoti). */
  preview?: { kind: string; to: string; detail: string }[];
};

function maskEmail(e: string): string {
  const [u, d] = e.split("@");
  return `${u.slice(0, 2)}***@${d ?? ""}`;
}

export async function runPromoCron(opts: { dryRun?: boolean } = {}): Promise<PromoRunResult> {
  const r: PromoRunResult = { visit_one_thanks_sent: 0, loyalty_sent: 0, party_thanks_sent: 0, reminders_sent: 0, anniversary_sent: 0, second_visit_sent: 0, errors: 0 };
  if (opts.dryRun) r.preview = [];
  if (!dbConfigured()) { r.skipped_reason = "db_not_configured"; return r; }
  if (!emailConfigured()) { r.skipped_reason = "email_not_configured"; return r; }

  const unsub = await listUnsubscribed();
  const dry = opts.dryRun ?? false;
  await Promise.all([
    generateVisitOneThanks(r, dry, unsub),
    generateLoyaltyCodes(r, dry, unsub),
    generatePartyThanksCodes(r, dry, unsub),
    sendExpiryReminders(r, dry, unsub),
  ]);
  // Naujos kampanijos: eilės tvarka (ne lygiagrečiai), kad neapkrautume Gmail SMTP.
  await generateAnniversaryCodes(r, dry, unsub);
  await generateSecondVisitCodes(r, dry, unsub);
  return r;
}

/* --------------- 0. Padėka po 1-o vizito (be kodo, tik akcijos anonsas) --------------- */

async function generateVisitOneThanks(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Vakar apmokėti room/game vizitai — sistemos ką tik įvykę.
  const yesterday = addDaysISO(todayISO(), -1);
  const { data, error } = await supabase
    .from("bookings")
    .select("customer_email, customer_name")
    .eq("status", "paid")
    .in("type", ["room", "game"])
    .eq("date", yesterday);
  if (error) { r.errors++; return; }
  if (!data) return;

  // Grupuojam pagal normalizuotą email — jei tas pats klientas turi 2 rezervacijas vakar,
  // vis tiek siunčiam vieną laišką.
  const byEmail = new Map<string, { email: string; name: string }>();
  for (const b of data) {
    const email = normalizeEmail(b.customer_email);
    if (!byEmail.has(email)) byEmail.set(email, { email, name: b.customer_name });
  }

  for (const g of byEmail.values()) {
    if (unsub.has(g.email)) continue;
    if (await visitOneThanksSentTo(g.email)) continue; // jau kada nors siųsta

    // Tikrinam ar tai iš tiesų 1-as jo vizitas (visą laiką).
    // Kai vakar buvo pirmas jo vizitas, iš viso yra 1 apmokėtas room/game.
    const { count } = await supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "paid")
      .in("type", ["room", "game"])
      .ilike("customer_email", g.email);
    if ((count ?? 0) !== 1) continue; // ne pirmas — nesiųsim padėkos su akcija

    if (dryRun) { r.visit_one_thanks_sent++; continue; }

    try {
      const { subject, html } = visitOneThanksEmail(g.name);
      await sendPromoMail(g.email, subject, html);
      await markVisitOneThanksSent(g.email);
      r.visit_one_thanks_sent++;
      console.log(`[promo] VISIT1_THANKS -> ${g.email}`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] VISIT1_THANKS klaida (${g.email}):`, e);
    }
  }
}

/* --------------- 1. Lojalumas --------------- */

async function generateLoyaltyCodes(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Paimam VISUS paid room/game per pastarąsias 90d, grupuojam pagal email.
  const cutoff = addDaysISO(todayISO(), -90);
  const { data, error } = await supabase
    .from("bookings")
    .select("customer_email, customer_name, date, id")
    .eq("status", "paid")
    .in("type", ["room", "game"])
    .gte("date", cutoff);
  if (error) { r.errors++; return; }
  if (!data) return;

  // Grupuojam pagal normalizuotą email.
  type Grp = { email: string; name: string; count: number; lastBookingId: string };
  const groups = new Map<string, Grp>();
  for (const b of data) {
    const email = normalizeEmail(b.customer_email);
    const g = groups.get(email);
    if (g) { g.count++; g.lastBookingId = b.id; }
    else groups.set(email, { email, name: b.customer_name, count: 1, lastBookingId: b.id });
  }

  for (const g of groups.values()) {
    if (g.count !== 2) continue; // reikia lygiai 2 apmokėtų vizitų per 90d
    if (unsub.has(g.email)) continue;
    if (await loyaltyCodeSentTo(g.email)) continue; // jau siųsta
    if (dryRun) { r.loyalty_sent++; continue; }

    const code = generateCodeString("SUGRIZK");
    const validFrom = todayISO();
    const validUntil = addDaysISO(validFrom, 60); // 60d nuo kodo išsiuntimo (aiškiai, be „nuo 1-o vizito" painiavos)
    const promo: PromoCode = {
      code, kind: "loyalty",
      discount_type: "percent", discount_value: 30,
      assigned_email: g.email,
      applies_to: ["room", "game"],
      valid_from: validFrom, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: g.lastBookingId,
      cancelled: false,
      min_visits_required: 2, // galios tik 3-iam+ vizitui
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markLoyaltySent(g.email, code);
      const { subject, html } = loyaltyEmail(g.name, code, validUntil);
      await sendPromoMail(g.email, subject, html);
      r.loyalty_sent++;
      console.log(`[promo] LOYALTY -> ${g.email} (${code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] LOYALTY klaida (${g.email}):`, e);
    }
  }
}

/* --------------- 2. Padėka gimtadienio užsakovui --------------- */

async function generatePartyThanksCodes(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  const supabase = getSupabaseAdmin();
  // Party rezervacijos, kurių data buvo prieš 3 dienas, apmokėtos.
  const targetDate = addDaysISO(todayISO(), -3);
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("status", "paid")
    .eq("type", "party")
    .eq("date", targetDate);
  if (error) { r.errors++; return; }
  if (!data) return;

  for (const b of data as BookingRow[]) {
    if (unsub.has(normalizeEmail(b.customer_email))) continue;
    if (await partyThanksSentFor(b.id)) continue; // jau siųsta
    if (dryRun) { r.party_thanks_sent++; continue; }

    const code = generateCodeString("ACIU");
    const email = normalizeEmail(b.customer_email);
    const validFrom = todayISO();
    const validUntil = addDaysISO(validFrom, 60);
    const promo: PromoCode = {
      code, kind: "party_thanks",
      discount_type: "percent", discount_value: 20,
      assigned_email: email,
      applies_to: ["room", "game"], // NE party
      valid_from: validFrom, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: b.id,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markPartyThanksSent(b.id, code);
      const { subject, html } = partyThanksEmail(b.customer_name, code, validUntil);
      await sendPromoMail(email, subject, html);
      r.party_thanks_sent++;
      console.log(`[promo] PARTY_THANKS -> ${email} (${code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] PARTY_THANKS klaida (${b.merchant_reference}):`, e);
    }
  }
}

/* --------------- 3. Priminimai 15d iki pabaigos (tik loyalty) --------------- */

async function sendExpiryReminders(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  const codes = await listPromoCodes();
  const target = addDaysISO(todayISO(), 15);
  for (const promo of codes) {
    if (promo.kind !== "loyalty") continue;
    if (promo.used_at || promo.cancelled) continue;
    if (promo.valid_until !== target) continue;
    if (unsub.has(promo.assigned_email)) continue;
    if (await reminderSentFor(promo.code)) continue;
    if (dryRun) { r.reminders_sent++; continue; }

    try {
      const supabase = getSupabaseAdmin();
      const { data: srcBooking } = await supabase
        .from("bookings")
        .select("customer_name")
        .eq("id", promo.source_booking_id ?? "")
        .maybeSingle();
      const name = (srcBooking?.customer_name as string) || "svetys";
      const { subject, html } = loyaltyReminderEmail(name, promo.code, promo.valid_until);
      await sendPromoMail(promo.assigned_email, subject, html);
      await markReminderSent(promo.code);
      r.reminders_sent++;
      console.log(`[promo] REMINDER -> ${promo.assigned_email} (${promo.code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] REMINDER klaida (${promo.code}):`, e);
    }
  }
}


/* --------------- 4. Metinių priminimas (2–5 sav. prieš gimtadienio metines) --------------- */

type AnnivClient = {
  email: string; name: string; lastParty: string;
  celebrant?: string; celebrantAge?: number; lastPartyYear?: number;
};

async function generateAnniversaryCodes(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  // Dry-run visada leidžiamas (nieko nesiunčia); realus siuntimas — tik įjungus PROMO_ANNIVERSARY_ENABLED=1.
  if (!dryRun && !flagOn("PROMO_ANNIVERSARY_ENABLED")) return;
  const supabase = getSupabaseAdmin();
  const today = todayISO();

  // 1) Apmokėtos gimtadienių rezervacijos (visos datos, įskaitant būsimas).
  const { data, error } = await supabase
    .from("bookings")
    .select("customer_email, customer_name, date, celebrant_name, celebrant_age")
    .eq("status", "paid")
    .eq("type", "party");
  if (error) { r.errors++; return; }

  const clients = new Map<string, AnnivClient>();
  for (const b of data ?? []) {
    const email = normalizeEmail(String(b.customer_email));
    const cur = clients.get(email);
    if (!cur || String(b.date) > cur.lastParty) {
      clients.set(email, {
        email, name: String(b.customer_name), lastParty: String(b.date),
        celebrant: b.celebrant_name ? String(b.celebrant_name) : undefined,
        celebrantAge: typeof b.celebrant_age === "number" ? b.celebrant_age : undefined,
        lastPartyYear: Number(String(b.date).slice(0, 4)),
      });
    }
  }
  // 2) Importuoti seni klientai (Moizmo) — jei jų paskutinė šventė vėlesnė, imame ją.
  for (const [email, h] of await listHistClients()) {
    const cur = clients.get(email);
    if (!cur) clients.set(email, { email, name: h.name, lastParty: h.last_party_date });
    else if (h.last_party_date > cur.lastParty) { cur.lastParty = h.last_party_date; cur.celebrant = undefined; cur.celebrantAge = undefined; }
  }

  for (const c of clients.values()) {
    if (unsub.has(c.email)) continue;
    const anniv = nextAnniversary(c.lastParty, today);
    const days = daysBetweenISO(today, anniv);
    if (days < ANNIV_MIN_DAYS || days > ANNIV_MAX_DAYS) continue;
    if (await anniversarySentFor(c.email, anniv)) continue;

    const nextAge = c.celebrant && c.celebrantAge && c.lastPartyYear
      ? c.celebrantAge + (Number(anniv.slice(0, 4)) - c.lastPartyYear)
      : undefined;
    if (dryRun) {
      r.anniversary_sent++;
      r.preview?.push({ kind: "anniversary", to: maskEmail(c.email), detail: `metinės ${anniv} (po ${days} d.), paskutinė šventė ${c.lastParty}${c.celebrant ? `, ${c.celebrant} → ${nextAge} m.` : ""}` });
      continue;
    }

    const code = generateCodeString("SVENTE");
    const validUntil = addDaysISO(anniv, 30); // iki 30 d. po metinių datos
    const promo: PromoCode = {
      code, kind: "anniversary",
      discount_type: "fixed", discount_value: 19,
      assigned_email: c.email,
      applies_to: ["party"],
      valid_from: today, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: null,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markAnniversarySent(c.email, anniv, code);
      const { subject, html } = anniversaryEmail({ name: c.name, code, validUntil, celebrant: c.celebrant, nextAge });
      await sendPromoMail(c.email, subject, html);
      r.anniversary_sent++;
      console.log(`[promo] ANNIVERSARY -> ${c.email} (${code}, metinės ${anniv})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] ANNIVERSARY klaida (${c.email}):`, e);
    }
  }
}

/* --------------- 5. Antro vizito kodas (~2 sav. po pirmo pabėgimo kambario vizito) --------------- */

async function generateSecondVisitCodes(r: PromoRunResult, dryRun: boolean, unsub: Set<string>): Promise<void> {
  if (!dryRun && !flagOn("PROMO_SECOND_VISIT_ENABLED")) return;
  const supabase = getSupabaseAdmin();
  const today = todayISO();
  // Langas 14–21 d. po vizito: jei cron vieną dieną nesuveikė, klientas vis tiek gaus kodą.
  const { data, error } = await supabase
    .from("bookings")
    .select("customer_email, customer_name, id")
    .eq("status", "paid")
    .in("type", ["room", "game"])
    .gte("date", addDaysISO(today, -21))
    .lte("date", addDaysISO(today, -14));
  if (error) { r.errors++; return; }

  const byEmail = new Map<string, { email: string; name: string; id: string }>();
  for (const b of data ?? []) {
    const email = normalizeEmail(String(b.customer_email));
    if (!byEmail.has(email)) byEmail.set(email, { email, name: String(b.customer_name), id: String(b.id) });
  }

  for (const g of byEmail.values()) {
    if (unsub.has(g.email)) continue;
    if (await secondVisitSentTo(g.email)) continue;
    // Tik pirmam apsilankymui: iš viso lygiai 1 apmokėtas room/game vizitas.
    if ((await countPaidRoomGameVisits(g.email)) !== 1) continue;
    if (dryRun) {
      r.second_visit_sent++;
      r.preview?.push({ kind: "second_visit", to: maskEmail(g.email), detail: "−15%, galioja 90 d." });
      continue;
    }

    const code = generateCodeString("KITAS");
    const validUntil = addDaysISO(today, 90);
    const promo: PromoCode = {
      code, kind: "second_visit",
      discount_type: "percent", discount_value: 15,
      assigned_email: g.email,
      applies_to: ["room", "game"],
      valid_from: today, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: g.id,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markSecondVisitSent(g.email, code);
      const { subject, html } = secondVisitEmail(g.name, code, validUntil);
      await sendPromoMail(g.email, subject, html);
      r.second_visit_sent++;
      console.log(`[promo] SECOND_VISIT -> ${g.email} (${code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] SECOND_VISIT klaida (${g.email}):`, e);
    }
  }
}


/* --------------- Vienkartinis „Ačiū už šventę" siuntimas (rankinis, ne cron) --------------- */

export type PartyThanksBatchResult = {
  candidates: number;
  sent: number;
  skipped_unsubscribed: number;
  skipped_already_thanked: number;
  errors: number;
  preview: { to: string; name: string; party_date: string; source: string }[];
  test_sent_to?: string;
  skipped_reason?: string;
};

/**
 * Išsiunčia „Ačiū už šventę" (ACIU −20%) visiems, kurių šventė buvo nuo `since` iki vakar,
 * ir kurie dar negavo. Šaltiniai: apmokėtos svetainės rezervacijos + importuoti seni klientai.
 *  - dryRun: nieko nesiunčia ir nerašo, tik grąžina sąrašą (el. paštai užmaskuoti).
 *  - testTo: išsiunčia VIENĄ bandomąjį laišką į nurodytą adresą su netikru kodu; DB nerašo.
 * Vykdoma TIK per /api/cron/promo-batch, kuris gyvoje svetainėje išjungtas (PROMO_BATCH_ENABLED).
 */
export async function runPartyThanksBatch(opts: {
  since: string; dryRun: boolean; testTo?: string;
}): Promise<PartyThanksBatchResult> {
  const out: PartyThanksBatchResult = {
    candidates: 0, sent: 0, skipped_unsubscribed: 0, skipped_already_thanked: 0, errors: 0, preview: [],
  };
  if (!dbConfigured()) { out.skipped_reason = "db_not_configured"; return out; }
  if (!emailConfigured()) { out.skipped_reason = "email_not_configured"; return out; }

  const supabase = getSupabaseAdmin();
  const today = todayISO();
  const unsub = await listUnsubscribed();

  type Rec = { email: string; name: string; date: string; key: string; sourceBookingId: string | null; source: string };
  const recs = new Map<string, Rec>();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_email, customer_name, date")
    .eq("status", "paid")
    .eq("type", "party")
    .gte("date", opts.since)
    .lt("date", today);
  if (error) { out.errors++; return out; }
  for (const b of data ?? []) {
    const email = normalizeEmail(String(b.customer_email));
    const cur = recs.get(email);
    if (!cur || String(b.date) > cur.date) {
      recs.set(email, { email, name: String(b.customer_name), date: String(b.date), key: String(b.id), sourceBookingId: String(b.id), source: "svetainė" });
    }
  }
  for (const [email, h] of await listHistClients()) {
    if (h.last_party_date < opts.since || h.last_party_date >= today) continue;
    if (recs.has(email)) continue;
    recs.set(email, { email, name: h.name, date: h.last_party_date, key: `hist:${email}|${h.last_party_date}`, sourceBookingId: null, source: h.source });
  }

  // Kas jau gavo ACIU per pastarąsias 60 d. (pagal išduotus kodus) — nesiunčiam antrą kartą.
  const cutoff = addDaysISO(today, -60);
  const alreadyByCode = new Set(
    (await listPromoCodes())
      .filter((c) => c.kind === "party_thanks" && c.issued_at.slice(0, 10) >= cutoff)
      .map((c) => c.assigned_email),
  );

  const list: Rec[] = [];
  for (const rec of [...recs.values()].sort((a, b) => a.date.localeCompare(b.date))) {
    if (unsub.has(rec.email)) { out.skipped_unsubscribed++; continue; }
    if (alreadyByCode.has(rec.email) || (await partyThanksSentFor(rec.key))) { out.skipped_already_thanked++; continue; }
    list.push(rec);
  }
  out.candidates = list.length;
  for (const rec of list) out.preview.push({ to: maskEmail(rec.email), name: rec.name.split(" ")[0], party_date: rec.date, source: rec.source });

  if (opts.testTo) {
    const sample = list[0];
    const { subject, html } = partyThanksEmail(sample ? sample.name : "Ieva", "ACIU-BANDYMAS", addDaysISO(today, 60));
    await sendPromoMail(opts.testTo, `[BANDYMAS] ${subject}`, html);
    out.test_sent_to = maskEmail(opts.testTo);
    return out;
  }
  if (opts.dryRun) return out;

  for (const rec of list) {
    const code = generateCodeString("ACIU");
    const validFrom = today;
    const validUntil = addDaysISO(validFrom, 60);
    const promo: PromoCode = {
      code, kind: "party_thanks",
      discount_type: "percent", discount_value: 20,
      assigned_email: rec.email,
      applies_to: ["room", "game"],
      valid_from: validFrom, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: rec.sourceBookingId,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markPartyThanksSent(rec.key, code);
      const { subject, html } = partyThanksEmail(rec.name, code, validUntil);
      await sendPromoMail(rec.email, subject, html);
      out.sent++;
      console.log(`[promo] PARTY_THANKS_BATCH -> ${rec.email} (${code})`);
    } catch (e) {
      out.errors++;
      console.error(`[promo] PARTY_THANKS_BATCH klaida (${rec.email}):`, e);
    }
    await new Promise((r) => setTimeout(r, 2000)); // neapkrauname Gmail SMTP
  }
  return out;
}


/* --------------- Vienkartinis „Dar vienas nuotykis" (−15%) visiems kambarių / VR žaidimų klientams --------------- */

/** Vardas laiško pradžiai: pirmas žodis, tvarkinga didžioji raidė („MARINA" → „Marina"). */
function firstNameOf(full: string): string {
  const w = (full || "").trim().split(/\s+/)[0] || "";
  if (!w) return "svety";
  return w.charAt(0).toLocaleUpperCase("lt") + w.slice(1).toLocaleLowerCase("lt");
}

export function returnOfferEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "Dar vienas nuotykis BALA virtualios realybės erdvėje? −15% nuolaida 🥽";
  const link = "https://bala.lt/rezervacija?utm_source=email&utm_medium=promo&utm_campaign=grizk-15";
  const html = shell(
    `<img src="https://bala.lt/assets/email-kosmosas-3.jpg" alt="VR pabėgimo kambarys „Kosminė stotis Tiberija“" width="476" style="display:block;width:100%;max-width:476px;height:auto;border-radius:10px;margin:0 0 16px" />` +
    `<h2 style="margin:0 0 12px;font-size:20px">Dar vienas nuotykis BALA virtualios realybės erdvėje?</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p style="margin-bottom:4px">Dovanojame</p>` +
    `<p style="text-align:center;margin:6px 0 14px;font-size:26px;line-height:1.25;font-weight:800;color:#0d2b35">−15% NUOLAIDĄ VR pabėgimo kambariui</p>` +
    `<p>Pasikvieskite draugus ar šeimą ir išbandykite naują scenarijų — pas mus jų net 9, o adrenalino ir gerų emocijų užtenka kiekvienam! 🥽</p>` +
    `<p style="text-align:center;margin:18px 0 0;color:#374151;font-size:13px;text-transform:uppercase;letter-spacing:.08em">Nuolaidos kodas</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 4px;color:#111827"><b>Nuolaida galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p style="text-align:center;margin:0 0 18px;color:#6b7280;font-size:12.5px">(60 dienų nuo šio laiško)</p>` +
    `<p>Rezervuokite <a href="${link}" style="color:#0d9488">www.bala.lt</a> ir įveskite nuolaidos kodą apmokėjimo lange.</p>` +
    `<p style="text-align:center;margin:20px 0"><a href="${link}" style="display:inline-block;background:#f0a500;color:#0d2b35;font-weight:700;text-decoration:none;padding:12px 26px;border-radius:10px">REZERVUOTI</a></p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuokite tuo pačiu el. paštu, kuriuo gavote laišką. Nuolaida nesisumuoja su dovanų kuponais.</p>` +
    `<p>Iki susitikimo!<br/><b>BALA VR komanda</b></p>`,
  );
  return { subject, html };
}

export type ReturnOfferBatchResult = {
  candidates: number;
  sent: number;
  skipped_unsubscribed: number;
  skipped_already: number;
  skipped_upcoming: number;
  errors: number;
  preview: { to: string; name: string; last_visit: string; source: string }[];
  test_sent_to?: string;
  skipped_reason?: string;
};

/**
 * Išsiunčia „Dar vienas nuotykis" (−15%, 60 d.) VISIEMS pabėgimo kambarių / VR žaidimų klientams:
 * apmokėtos svetainės rezervacijos (room/game) + importuoti seni klientai.
 * Praleidžiami: atsisakę, jau gavę KITAS kodą, gavę ACIU per 60 d. ir turintys būsimą rezervaciją.
 *  - dryRun: nieko nesiunčia ir nerašo; testTo: vienas bandomasis laiškas su netikru kodu, DB nerašo.
 * Vykdoma TIK per /api/cron/promo-batch?campaign=return (gyvoje svetainėje išjungta).
 */
export async function runReturnOfferBatch(opts: { dryRun: boolean; testTo?: string }): Promise<ReturnOfferBatchResult> {
  const out: ReturnOfferBatchResult = {
    candidates: 0, sent: 0, skipped_unsubscribed: 0, skipped_already: 0, skipped_upcoming: 0, errors: 0, preview: [],
  };
  if (!dbConfigured()) { out.skipped_reason = "db_not_configured"; return out; }
  if (!emailConfigured()) { out.skipped_reason = "email_not_configured"; return out; }

  const supabase = getSupabaseAdmin();
  const today = todayISO();
  const unsub = await listUnsubscribed();

  type Rec = { email: string; name: string; last: string; sourceBookingId: string | null; source: string };
  const recs = new Map<string, Rec>();

  const { data, error } = await supabase
    .from("bookings")
    .select("id, customer_email, customer_name, date")
    .eq("status", "paid")
    .in("type", ["room", "game"]);
  if (error) { out.errors++; return out; }
  for (const b of data ?? []) {
    const email = normalizeEmail(String(b.customer_email));
    const cur = recs.get(email);
    if (!cur || String(b.date) > cur.last) {
      recs.set(email, { email, name: String(b.customer_name), last: String(b.date), sourceBookingId: String(b.id), source: "svetainė" });
    }
  }
  for (const [email, c] of await listRoomClients()) {
    const cur = recs.get(email);
    if (!cur) recs.set(email, { email, name: c.name, last: c.last_visit_date, sourceBookingId: null, source: c.source });
    else if (c.last_visit_date > cur.last) cur.last = c.last_visit_date;
  }

  // Nesiunčiam antrą kartą tiems, kas ACIU gavo per pastarąsias 60 d.
  const cutoff = addDaysISO(today, -60);
  const gotAciu = new Set(
    (await listPromoCodes())
      .filter((c) => c.kind === "party_thanks" && c.issued_at.slice(0, 10) >= cutoff)
      .map((c) => c.assigned_email),
  );

  const list: Rec[] = [];
  for (const rec of [...recs.values()].sort((a, b) => a.last.localeCompare(b.last))) {
    if (unsub.has(rec.email)) { out.skipped_unsubscribed++; continue; }
    if (rec.last >= today) { out.skipped_upcoming++; continue; } // turi būsimą rezervaciją — ji ir taip ateis
    if (gotAciu.has(rec.email) || (await secondVisitSentTo(rec.email))) { out.skipped_already++; continue; }
    list.push(rec);
  }
  out.candidates = list.length;
  for (const rec of list) out.preview.push({ to: maskEmail(rec.email), name: firstNameOf(rec.name), last_visit: rec.last, source: rec.source });

  if (opts.testTo) {
    const sample = list[0];
    const { subject, html } = returnOfferEmail(sample ? firstNameOf(sample.name) : "Ieva", "KITAS-BANDYMAS", addDaysISO(today, 60));
    await sendPromoMail(opts.testTo, `[BANDYMAS] ${subject}`, html);
    out.test_sent_to = maskEmail(opts.testTo);
    return out;
  }
  if (opts.dryRun) return out;

  for (const rec of list) {
    const code = generateCodeString("KITAS");
    const validUntil = addDaysISO(today, 60);
    const promo: PromoCode = {
      code, kind: "second_visit",
      discount_type: "percent", discount_value: 15,
      assigned_email: rec.email,
      applies_to: ["room", "game"],
      valid_from: today, valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: rec.sourceBookingId,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: 1,
      used_count: 0,
    };
    try {
      await insertPromoCode(promo);
      await markSecondVisitSent(rec.email, code);
      const { subject, html } = returnOfferEmail(firstNameOf(rec.name), code, validUntil);
      await sendPromoMail(rec.email, subject, html);
      out.sent++;
      console.log(`[promo] RETURN_OFFER -> ${rec.email} (${code})`);
    } catch (e) {
      out.errors++;
      console.error(`[promo] RETURN_OFFER klaida (${rec.email}):`, e);
    }
    await new Promise((r) => setTimeout(r, 2000)); // neapkrauname Gmail SMTP
  }
  return out;
}
