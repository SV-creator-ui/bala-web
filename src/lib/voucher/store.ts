/**
 * Dovanų kuponų duomenų sluoksnis (Supabase). TIK serveriui.
 * Kupono gyvavimo ciklas: pending -> active (apmokėjus) -> redeemed (panaudojus).
 */
import { getSupabaseAdmin, type VoucherRow } from "@/lib/supabase/server";
import { venueNow } from "@/lib/booking/config";
import { generateVoucherCode, voucherValidUntil } from "./config";

export type CreateVoucherInput = {
  amount: number;
  buyerName: string;
  buyerEmail: string;
  recipientName?: string | null;
  fromName?: string | null;
  message?: string | null;
  merchantReference: string;
  /** Testavimo režimu kuponas iškart „active" (be Montonio). */
  paidImmediately?: boolean;
};

/** Sukuria „pending" kuponą (arba iškart „active" testavimo režimu). */
export async function createVoucher(input: CreateVoucherInput): Promise<VoucherRow> {
  const supabase = getSupabaseAdmin();
  const row: Record<string, unknown> = {
    amount_eur: input.amount,
    status: "pending",
    buyer_name: input.buyerName,
    buyer_email: input.buyerEmail,
    recipient_name: input.recipientName?.trim() || null,
    from_name: input.fromName?.trim() || null,
    message: input.message?.trim() || null,
    merchant_reference: input.merchantReference,
  };
  const { data, error } = await supabase.from("vouchers").insert(row).select("*").single();
  if (error) throw error;
  const voucher = data as VoucherRow;
  if (input.paidImmediately) return (await issueVoucher(voucher.id)) ?? voucher;
  return voucher;
}

export async function getVoucherByRef(ref: string): Promise<VoucherRow | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("vouchers").select("*").eq("merchant_reference", ref).single();
  return (data as VoucherRow) ?? null;
}

export async function getVoucherById(id: string): Promise<VoucherRow | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("vouchers").select("*").eq("id", id).single();
  return (data as VoucherRow) ?? null;
}

export async function setMontonioUuid(id: string, uuid: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("vouchers").update({ montonio_uuid: uuid }).eq("id", id);
}

/**
 * Aktyvuoja kuponą apmokėjus: sugeneruoja unikalų kodą, nustato galiojimą.
 * Idempotentiška — jei jau aktyvuotas, grąžina esamą įrašą.
 * Grąžina aktyvų įrašą arba null (jei nerastas / klaida).
 */
export async function issueVoucher(id: string): Promise<VoucherRow | null> {
  const supabase = getSupabaseAdmin();
  const existing = await getVoucherById(id);
  if (!existing) return null;
  if (existing.status !== "pending") return existing; // jau aktyvuotas ar kt.

  const validUntil = voucherValidUntil();
  // Bandome sugeneruoti unikalų kodą (kodo laukas turi UNIQUE apribojimą).
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = generateVoucherCode();
    const { data, error } = await supabase
      .from("vouchers")
      .update({
        code,
        status: "active",
        valid_until: validUntil,
        issued_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("status", "pending") // tik jei dar pending (idempotencija prieš lenktynes)
      .select("*")
      .single();

    if (!error && data) return data as VoucherRow;
    // 23505 = unique_violation (kodo kolizija) — bandome kitą kodą.
    if (error && (error as { code?: string }).code !== "23505") {
      // Galbūt kitas procesas jau aktyvavo — grąžinam dabartinę būseną.
      const now = await getVoucherById(id);
      if (now && now.status !== "pending") return now;
      throw error;
    }
  }
  throw new Error("Nepavyko sugeneruoti unikalaus kupono kodo");
}

/**
 * Pažymi kaip išsiųstą + atlaisvina claim'ą (po sėkmingo send).
 * Admin resend kelias irgi juo naudojasi (žr. resendVoucherEmail).
 */
export async function markVoucherEmailsSent(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase
    .from("vouchers")
    .update({ emails_sent_at: new Date().toISOString(), email_send_claimed_at: null })
    .eq("id", id);
}

/** Atlaisvina claim'ą po send klaidos, kad sekantis retry galėtų perimti. */
export async function releaseVoucherEmailClaim(id: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  await supabase.from("vouchers").update({ email_send_claimed_at: null }).eq("id", id);
}

/** Kiek laiko voucher claim'as galioja iki kito retry gali jį perimti (crash safety). */
const VOUCHER_CLAIM_STALE_MS = 10 * 60 * 1000;

/**
 * Atominis „claim" (lease) laiško siuntimui — kad webhook IR patvirtinimo puslapis
 * nesiųstų dublikato. Grąžina true tik pirmam kviesėjui.
 *
 * DIZAINAS (migration_010_email_send_claim.sql):
 *  • `email_send_claimed_at` — lease (perimamas jei senesnis nei 10 min)
 *  • `emails_sent_at`        — nustatomas TIK po sėkmingo send'o
 *
 * Iki migration_010 šis metodas naudojo `emails_sent_at` kaip laikiną claim'ą —
 * turėjo crash-window'ą, kai `emails_sent_at` lieka nustatytas net jei send
 * niekada neįvyko. Dabar dvi žymos atskirtos: sekantis retry po crash'o
 * perima stale claim'ą ir bandys iš naujo.
 */
export async function claimVoucherEmail(id: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const staleThreshold = new Date(Date.now() - VOUCHER_CLAIM_STALE_MS).toISOString();
  const { data } = await supabase
    .from("vouchers")
    .update({ email_send_claimed_at: new Date().toISOString() })
    .eq("id", id)
    .is("emails_sent_at", null)
    .or(`email_send_claimed_at.is.null,email_send_claimed_at.lt.${staleThreshold}`)
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

/** Galiojantis (panaudojamas) kuponas pagal kodą, arba null. */
export async function getRedeemableVoucher(code: string): Promise<VoucherRow | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("vouchers").select("*").eq("code", code).single();
  const v = data as VoucherRow | null;
  if (!v) return null;
  if (v.status !== "active") return null;
  const today = venueNow().date;
  if (v.valid_until && v.valid_until < today) return null; // pasibaigęs
  return v;
}

/** Kuponas pagal kodą, bet kokios būsenos — arba null jei nerastas. */
export async function lookupVoucher(code: string): Promise<VoucherRow | null> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase.from("vouchers").select("*").eq("code", code).maybeSingle();
  return (data as VoucherRow | null) ?? null;
}

/**
 * Nurašo kuponą (vienkartinis) konkrečiai rezervacijai. Atominis:
 * active -> redeemed tik jei DAR aktyvus. Idempotentiška, saugu kartoti.
 */
export async function settleVoucherForBooking(code: string, bookingRef: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data } = await supabase
    .from("vouchers")
    .update({
      status: "redeemed",
      redeemed_at: new Date().toISOString(),
      redeemed_booking_ref: bookingRef,
    })
    .eq("code", code)
    .eq("status", "active")
    .select("id");
  return Array.isArray(data) && data.length > 0;
}

/* ============ ADMIN ============ */

export type VoucherFilter = { status?: VoucherRow["status"] | "all" };

export async function listVouchers(filter: VoucherFilter = {}): Promise<VoucherRow[]> {
  const supabase = getSupabaseAdmin();
  let q = supabase.from("vouchers").select("*");
  if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  const { data, error } = await q.order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VoucherRow[];
}

/** Rankinis kupono nurašymas / atkūrimas / atšaukimas admin skydelyje. */
export async function updateVoucherStatus(id: string, status: VoucherRow["status"]): Promise<void> {
  const supabase = getSupabaseAdmin();
  const patch: Record<string, unknown> = { status };
  if (status === "redeemed") patch.redeemed_at = new Date().toISOString();
  if (status === "active") {
    patch.redeemed_at = null;
    patch.redeemed_booking_ref = null;
  }
  const { error } = await supabase.from("vouchers").update(patch).eq("id", id);
  if (error) throw error;
}
