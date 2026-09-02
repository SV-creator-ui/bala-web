/**
 * Dovanų kupono panaudojimas rezervacijoje. Kuponas taikomas VISAI užsakymo
 * sumai; jei padengia avansą — online mokėjimas praleidžiamas. VIENKARTINIS:
 * likutis (jei kupono vertė didesnė) NESAUGOMAS.
 */
import type { BookingRow, VoucherRow } from "@/lib/supabase/server";
import { getRedeemableVoucher, settleVoucherForBooking } from "./store";
import { normalizeVoucherCode } from "./config";

export type VoucherApplication = {
  voucher: VoucherRow;
  discount: number; // kiek kuponas padengia (min(vertė, suma))
  effectiveTotal: number; // suma po kupono
  onlineDue: number; // kiek reikia sumokėti internetu dabar
  onSite: number; // likutis vietoje
};

/**
 * Apskaičiuoja kupono pritaikymą. Grąžina null, jei kodas negalioja/panaudotas.
 * total — pilna užsakymo suma; deposit — įprastas avansas.
 */
export async function applyVoucherToBooking(
  code: string,
  total: number,
  deposit: number,
): Promise<VoucherApplication | null> {
  const v = await getRedeemableVoucher(normalizeVoucherCode(code));
  if (!v) return null;
  const discount = Math.min(Number(v.amount_eur), total);
  const effectiveTotal = Math.max(0, total - discount);
  const onlineDue = Math.min(deposit, effectiveTotal);
  const onSite = effectiveTotal - onlineDue;
  return { voucher: v, discount, effectiveTotal, onlineDue, onSite };
}

/**
 * Nurašo rezervacijos kuponą (kai rezervacija tampa „paid"). Idempotentiška:
 * active -> redeemed tik jei dar aktyvus. Saugu kviesti kelis kartus.
 */
export async function settleBookingVoucher(booking: BookingRow): Promise<void> {
  if (!booking.voucher_code) return;
  try {
    await settleVoucherForBooking(booking.voucher_code, booking.merchant_reference);
  } catch (e) {
    console.error("voucher settle error:", e);
  }
}
