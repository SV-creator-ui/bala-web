/**
 * Promo kodų saugojimas naudojant sentinel eilutes `blackouts` lentelėje.
 * NEREIKIA jokios migracijos — viskas telpa į esamą schemą.
 *
 * Sentinel eilutės (visos filtruojamos iš admin blackouts sąrašo per date < 2000-01-01):
 *  - PROMO_CODE_DATE ('1900-01-03'): time=<code>, reason=<PromoCode JSON>
 *  - LOYALTY_SENT_DATE ('1900-01-06'): time=<normalized_email>, reason=<code>
 *  - PARTY_THANKS_SENT_DATE ('1900-01-07'): time=<booking_id>, reason=<code>
 *  - REMINDER_SENT_DATE ('1900-01-08'): time=<code>, reason=<iso timestamp>
 *  - VISIT_ONE_THANKS_DATE ('1900-01-10'): time=<normalized_email>, reason=<iso timestamp>
 *  - ANNIVERSARY_SENT_DATE ('1900-01-11'): time=<email>|<anniversary YYYY-MM-DD>, reason=<code>
 *  - UNSUBSCRIBED_DATE ('1900-01-12'): time=<normalized_email>, reason=<iso timestamp>
 *  - HIST_CLIENT_DATE ('1900-01-13'): time=<normalized_email>, reason=<HistClient JSON> (importuoti seni klientai)
 *  - SECOND_VISIT_SENT_DATE ('1900-01-14'): time=<normalized_email>, reason=<code>
 */
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { dbConfigured } from "@/lib/admin/auth";
import { randomBytes } from "node:crypto";

export const PROMO_CODE_DATE = "1900-01-03";
export const LOYALTY_SENT_DATE = "1900-01-06";
export const PARTY_THANKS_SENT_DATE = "1900-01-07";
export const REMINDER_SENT_DATE = "1900-01-08";
export const VISIT_ONE_THANKS_DATE = "1900-01-10";
export const ANNIVERSARY_SENT_DATE = "1900-01-11";
export const UNSUBSCRIBED_DATE = "1900-01-12";
export const HIST_CLIENT_DATE = "1900-01-13";
export const SECOND_VISIT_SENT_DATE = "1900-01-14";

export type PromoKind = "loyalty" | "party_thanks" | "anniversary" | "second_visit" | "manual";
export type PromoDiscountType = "percent" | "fixed";
export type PromoAppliesTo = "room" | "game" | "party";

export type PromoCode = {
  code: string;
  kind: PromoKind;
  discount_type: PromoDiscountType;
  discount_value: number; // % arba EUR (priklauso nuo discount_type)
  /** Normalizuotas email (lower+trim). Tuščias = MASINIS kodas (be email apribojimo). */
  assigned_email: string;
  applies_to: PromoAppliesTo[]; // paslaugų tipai, kur kodas tinka
  valid_from: string; // YYYY-MM-DD
  valid_until: string; // YYYY-MM-DD (imtinai)
  issued_at: string; // ISO
  /** Kada paskutinį kartą buvo panaudota. Auto-generuoti kodai (loyalty/party) — pirma ir vienintelė. */
  used_at: string | null;
  used_booking_id: string | null;
  used_booking_ref: string | null;
  /** Kuri rezervacija tai iššaukė (party -> thanks, 2nd visit -> loyalty). */
  source_booking_id: string | null;
  cancelled: boolean;
  min_visits_required: number; // 0 = jokių reikalavimų; 2 = tinka tik 3+ vizitui
  allow_voucher_stack: boolean; // false = negalima kartu su dovanų kuponu
  /** Kiek kartų iš viso galima panaudoti. 0 = neribotai; 1 = vienkartinis (auto kodai); N = ribotas. */
  max_uses: number;
  /** Kiek kartų jau panaudota. */
  used_count: number;
};

export function normalizeEmail(e: string): string {
  return e.trim().toLowerCase();
}

/** Sugeneruoja unikalų kodo prefix'ą su random dalim. */
export function generateCodeString(prefix: "SUGRIZK" | "ACIU" | "SVENTE" | "KITAS"): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // be I/O/0/1 — vengiam painiavos
  const buf = randomBytes(6);
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += alphabet[buf[i] % alphabet.length];
  return `${prefix}-${suffix}`;
}

/* -------------------- CRUD -------------------- */

export async function insertPromoCode(promo: PromoCode): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: PROMO_CODE_DATE, time: promo.code, reason: JSON.stringify(promo) });
  if (error) throw error;
}

export async function findPromoByCode(code: string): Promise<PromoCode | null> {
  if (!dbConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blackouts")
    .select("reason")
    .eq("date", PROMO_CODE_DATE)
    .eq("time", code)
    .maybeSingle();
  if (error || !data?.reason) return null;
  try {
    return JSON.parse(data.reason as string) as PromoCode;
  } catch {
    return null;
  }
}

export async function updatePromoCode(promo: PromoCode): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .update({ reason: JSON.stringify(promo) })
    .eq("date", PROMO_CODE_DATE)
    .eq("time", promo.code);
  if (error) throw error;
}

export async function listPromoCodes(): Promise<PromoCode[]> {
  if (!dbConfigured()) return [];
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("blackouts")
    .select("reason")
    .eq("date", PROMO_CODE_DATE);
  if (error || !data) return [];
  return data
    .map((r) => {
      try { return JSON.parse(r.reason as string) as PromoCode; } catch { return null; }
    })
    .filter((v): v is PromoCode => v !== null);
}

/* -------------------- „Jau siųsta" žymos -------------------- */

/** Ar jau kada nors buvo išsiųstas lojalumo kodas šiam email? */
export async function loyaltyCodeSentTo(email: string): Promise<string | null> {
  if (!dbConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("reason")
    .eq("date", LOYALTY_SENT_DATE)
    .eq("time", normalizeEmail(email))
    .maybeSingle();
  return data ? (data.reason as string) : null;
}

export async function markLoyaltySent(email: string, code: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: LOYALTY_SENT_DATE, time: normalizeEmail(email), reason: code });
  if (error) throw error;
}

export async function partyThanksSentFor(bookingId: string): Promise<string | null> {
  if (!dbConfigured()) return null;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("reason")
    .eq("date", PARTY_THANKS_SENT_DATE)
    .eq("time", bookingId)
    .maybeSingle();
  return data ? (data.reason as string) : null;
}

export async function markPartyThanksSent(bookingId: string, code: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: PARTY_THANKS_SENT_DATE, time: bookingId, reason: code });
  if (error) throw error;
}

export async function reminderSentFor(code: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", REMINDER_SENT_DATE)
    .eq("time", code)
    .maybeSingle();
  return !!data;
}

export async function markReminderSent(code: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: REMINDER_SENT_DATE, time: code, reason: new Date().toISOString() });
  if (error) throw error;
}

/** Ar 1-o vizito padėkos laiškas jau siųstas šiam email? */
export async function visitOneThanksSentTo(email: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", VISIT_ONE_THANKS_DATE)
    .eq("time", normalizeEmail(email))
    .maybeSingle();
  return !!data;
}

export async function markVisitOneThanksSent(email: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: VISIT_ONE_THANKS_DATE, time: normalizeEmail(email), reason: new Date().toISOString() });
  if (error) throw error;
}

/* -------------------- Vizitų skaitiklis -------------------- */

/** Kiek email turi apmokėtų room/game rezervacijų (visą laiką arba per N dienų). */
export async function countPaidRoomGameVisits(
  email: string,
  opts: { withinDays?: number } = {},
): Promise<number> {
  if (!dbConfigured()) return 0;
  const supabase = getSupabaseAdmin();
  const normalized = normalizeEmail(email);
  let q = supabase
    .from("bookings")
    .select("id, date", { count: "exact" })
    .eq("status", "paid")
    .in("type", ["room", "game"])
    .ilike("customer_email", normalized);
  if (opts.withinDays) {
    const cutoff = new Date(Date.now() - opts.withinDays * 86400000).toISOString().slice(0, 10);
    q = q.gte("date", cutoff);
  }
  const { count, error } = await q;
  if (error) return 0;
  return count ?? 0;
}


/* -------------------- Atsisakymas nuo rinkodaros laiškų -------------------- */

export async function isUnsubscribed(email: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", UNSUBSCRIBED_DATE)
    .eq("time", normalizeEmail(email))
    .maybeSingle();
  return !!data;
}

/** Idempotentiškai pažymi, kad šis email nebenori rinkodaros laiškų. */
export async function markUnsubscribed(email: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  if (await isUnsubscribed(email)) return;
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: UNSUBSCRIBED_DATE, time: normalizeEmail(email), reason: new Date().toISOString() });
  if (error) throw error;
}

/** Visi atsisakę email'ai (vienu kreipiniu — cron'ams). */
export async function listUnsubscribed(): Promise<Set<string>> {
  if (!dbConfigured()) return new Set();
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("blackouts").select("time").eq("date", UNSUBSCRIBED_DATE);
  return new Set((data ?? []).map((r) => String(r.time)));
}

/* -------------------- Metinių priminimų žymos + importuoti seni klientai -------------------- */

export type HistClient = {
  name: string;
  /** Paskutinio gimtadienio šventės data (YYYY-MM-DD), įskaitant būsimas. */
  last_party_date: string;
  source: string; // pvz. "moizmo"
};

export async function listHistClients(): Promise<Map<string, HistClient>> {
  const out = new Map<string, HistClient>();
  if (!dbConfigured()) return out;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("blackouts").select("time, reason").eq("date", HIST_CLIENT_DATE);
  for (const r of data ?? []) {
    try { out.set(String(r.time), JSON.parse(String(r.reason)) as HistClient); } catch { /* praleidžiam sugadintą */ }
  }
  return out;
}

/** Raktas „šiam email šiai metinių datai" — tik vienas laiškas per metus. */
export function anniversaryKey(email: string, anniversaryISO: string): string {
  return `${normalizeEmail(email)}|${anniversaryISO}`;
}

export async function anniversarySentFor(email: string, anniversaryISO: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", ANNIVERSARY_SENT_DATE)
    .eq("time", anniversaryKey(email, anniversaryISO))
    .maybeSingle();
  return !!data;
}

export async function markAnniversarySent(email: string, anniversaryISO: string, code: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: ANNIVERSARY_SENT_DATE, time: anniversaryKey(email, anniversaryISO), reason: code });
  if (error) throw error;
}

export async function secondVisitSentTo(email: string): Promise<boolean> {
  if (!dbConfigured()) return false;
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("blackouts")
    .select("time")
    .eq("date", SECOND_VISIT_SENT_DATE)
    .eq("time", normalizeEmail(email))
    .maybeSingle();
  return !!data;
}

export async function markSecondVisitSent(email: string, code: string): Promise<void> {
  if (!dbConfigured()) throw new Error("DB nesukonfigūruota");
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("blackouts")
    .insert({ date: SECOND_VISIT_SENT_DATE, time: normalizeEmail(email), reason: code });
  if (error) throw error;
}
