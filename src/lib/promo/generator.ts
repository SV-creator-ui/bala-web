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
 *     - Galioja 45 dienas nuo išsiuntimo
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
  type PromoCode,
} from "./storage";

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
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0">BALA VR · Pajūrio g. 5B, Klaipėda · +370 684 26686</p>
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
    `<p>Kai grįšite antrą kartą, atsiųsime jums <b>asmeninį nuolaidos kodą</b> — tereikės įvesti rezervuojant.</p>` +
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

function partyThanksEmail(name: string, code: string, validUntil: string): { subject: string; html: string } {
  const subject = "Ačiū už šventę BALA VR 🎉";
  const html = shell(
    `<h2 style="margin:0 0 12px;font-size:20px">Ačiū už šventę!</h2>` +
    `<p>Sveiki, ${escapeHtml(name)}!</p>` +
    `<p>Ačiū, kad šventėte pas mus BALA VR. Tikimės, kad svečiai liko sužavėti.</p>` +
    `<p>Kaip padėka už apsilankymą, dovanojame jums <b>20% nuolaidą VR pabėgimo kambariui arba veiksmo žaidimams</b>.</p>` +
    codeBadge(code) +
    `<p style="text-align:center;margin:0 0 4px;color:#111827"><b>Nuolaida galioja iki ${fmtDateLT(validUntil)}</b></p>` +
    `<p style="text-align:center;margin:0 0 18px;color:#6b7280;font-size:12.5px">(45 dienos nuo šio laiško)</p>` +
    `<p>Rezervuok <a href="https://bala.lt" style="color:#0d9488">bala.lt</a> ir įvesk kodą apmokėjimo lange.</p>` +
    `<p style="color:#6b7280;font-size:12.5px">Kodas išduotas asmeniškai — rezervuok tuo pačiu el. paštu, kuriuo gavai laišką. Nuolaida nesikaupia su dovanų kuponais.</p>` +
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

/* --------------- Trigger'iai (cron) --------------- */

export type PromoRunResult = {
  visit_one_thanks_sent: number;
  loyalty_sent: number;
  party_thanks_sent: number;
  reminders_sent: number;
  errors: number;
  skipped_reason?: string;
};

export async function runPromoCron(opts: { dryRun?: boolean } = {}): Promise<PromoRunResult> {
  const r: PromoRunResult = { visit_one_thanks_sent: 0, loyalty_sent: 0, party_thanks_sent: 0, reminders_sent: 0, errors: 0 };
  if (!dbConfigured()) { r.skipped_reason = "db_not_configured"; return r; }
  if (!emailConfigured()) { r.skipped_reason = "email_not_configured"; return r; }

  await Promise.all([
    generateVisitOneThanks(r, opts.dryRun ?? false),
    generateLoyaltyCodes(r, opts.dryRun ?? false),
    generatePartyThanksCodes(r, opts.dryRun ?? false),
    sendExpiryReminders(r, opts.dryRun ?? false),
  ]);
  return r;
}

/* --------------- 0. Padėka po 1-o vizito (be kodo, tik akcijos anonsas) --------------- */

async function generateVisitOneThanks(r: PromoRunResult, dryRun: boolean): Promise<void> {
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
      await getTransporter().sendMail({ from: senderAddress(), to: g.email, subject, html });
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

async function generateLoyaltyCodes(r: PromoRunResult, dryRun: boolean): Promise<void> {
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
      await getTransporter().sendMail({ from: senderAddress(), to: g.email, subject, html });
      r.loyalty_sent++;
      console.log(`[promo] LOYALTY -> ${g.email} (${code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] LOYALTY klaida (${g.email}):`, e);
    }
  }
}

/* --------------- 2. Padėka gimtadienio užsakovui --------------- */

async function generatePartyThanksCodes(r: PromoRunResult, dryRun: boolean): Promise<void> {
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
    if (await partyThanksSentFor(b.id)) continue; // jau siųsta
    if (dryRun) { r.party_thanks_sent++; continue; }

    const code = generateCodeString("ACIU");
    const email = normalizeEmail(b.customer_email);
    const validFrom = todayISO();
    const validUntil = addDaysISO(validFrom, 45);
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
      await getTransporter().sendMail({ from: senderAddress(), to: email, subject, html });
      r.party_thanks_sent++;
      console.log(`[promo] PARTY_THANKS -> ${email} (${code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] PARTY_THANKS klaida (${b.merchant_reference}):`, e);
    }
  }
}

/* --------------- 3. Priminimai 15d iki pabaigos (tik loyalty) --------------- */

async function sendExpiryReminders(r: PromoRunResult, dryRun: boolean): Promise<void> {
  const codes = await listPromoCodes();
  const target = addDaysISO(todayISO(), 15);
  for (const promo of codes) {
    if (promo.kind !== "loyalty") continue;
    if (promo.used_at || promo.cancelled) continue;
    if (promo.valid_until !== target) continue;
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
      await getTransporter().sendMail({ from: senderAddress(), to: promo.assigned_email, subject, html });
      await markReminderSent(promo.code);
      r.reminders_sent++;
      console.log(`[promo] REMINDER -> ${promo.assigned_email} (${promo.code})`);
    } catch (e) {
      r.errors++;
      console.error(`[promo] REMINDER klaida (${promo.code}):`, e);
    }
  }
}
