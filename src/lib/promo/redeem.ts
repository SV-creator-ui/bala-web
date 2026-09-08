/**
 * Promo kodo validacija ir taikymas rezervacijoje.
 * Griežta kontrolė: kodas rišamas su konkretaus kliento el. paštu, o loyalty
 * kodas dar reikalauja, kad ankstesnių apmokėtų room/game vizitų būtų ≥ 2.
 */
import type { BookingRow } from "@/lib/supabase/server";
import { findPromoByCode, updatePromoCode, countPaidRoomGameVisits, normalizeEmail } from "./storage";
import type { PromoCode } from "./storage";

export type PromoValidation =
  | { ok: true; discount: number; promo: PromoCode }
  | { ok: false; error: string };

export type PromoCheckInput = {
  code: string;
  email: string;
  type: "room" | "game" | "party";
  total: number; // pilna kaina EUR (be nuolaidos)
  hasVoucher: boolean;
};

/** Kliento matomas validavimas prieš mokėjimą — grąžina nuolaidos dydį EUR. */
export async function validatePromoForBooking(input: PromoCheckInput): Promise<PromoValidation> {
  const code = input.code.trim().toUpperCase();
  if (!code) return { ok: false, error: "Įvesk kodą" };

  const promo = await findPromoByCode(code);
  if (!promo) return { ok: false, error: "Toks kodas nerastas" };
  if (promo.cancelled) return { ok: false, error: "Kodas atšauktas" };

  // Panaudojimų limitas — 0 = neribotai; N = leidžiama N kartų.
  const maxUses = Number(promo.max_uses ?? 1);
  const usedCount = Number(promo.used_count ?? (promo.used_at ? 1 : 0));
  if (maxUses > 0 && usedCount >= maxUses) return { ok: false, error: "Kodas jau panaudotas" };

  const today = new Date().toISOString().slice(0, 10);
  if (today < promo.valid_from) return { ok: false, error: "Kodas dar negalioja" };
  if (today > promo.valid_until) return { ok: false, error: "Kodo galiojimas pasibaigė" };

  if (!promo.applies_to.includes(input.type)) {
    const nice = promo.applies_to.map(labelType).join(" arba ");
    return { ok: false, error: `Šis kodas tinka tik: ${nice}` };
  }

  // Griežta email kontrolė TIK jei kodas asmeninis (assigned_email nustatytas).
  // Masiniams kodams (tuščias assigned_email) šis patikrinimas praleidžiamas.
  if (promo.assigned_email && normalizeEmail(input.email) !== promo.assigned_email) {
    return { ok: false, error: "Kodas išduotas kitam el. paštui — rezervuok tuo pačiu adresu, kuriuo gavai laišką" };
  }

  if (input.hasVoucher && !promo.allow_voucher_stack) {
    return { ok: false, error: "Šis kodas nesikaupia su dovanų kuponu — pasirink vieną" };
  }

  // Lojalumo kodui: tikrinam kad tai bus (>= min_visits_required + 1)-as vizitas
  if (promo.min_visits_required > 0) {
    const priorVisits = await countPaidRoomGameVisits(input.email);
    if (priorVisits < promo.min_visits_required) {
      return {
        ok: false,
        error: `Šis kodas skirtas ${promo.min_visits_required + 1}-am vizitui. Šiuo metu esi tik ${priorVisits + 1}-am. Kodas laukia tavo kito vizito.`,
      };
    }
  }

  const discount = computeDiscount(promo, input.total);
  return { ok: true, discount, promo };
}

function labelType(t: string): string {
  if (t === "room") return "pabėgimo kambariai";
  if (t === "game") return "VR veiksmo žaidimai";
  if (t === "party") return "gimtadieniai";
  return t;
}

export function computeDiscount(promo: PromoCode, total: number): number {
  if (promo.discount_type === "percent") {
    return Math.round(total * promo.discount_value) / 100;
  }
  // fixed EUR
  return Math.min(promo.discount_value, total);
}

/** Pažymi kodą kaip panaudotą po sėkmingo apmokėjimo. Palaikoma daugkartinių panaudojimų. */
export async function settlePromoForBooking(
  code: string, booking: Pick<BookingRow, "id" | "merchant_reference">,
): Promise<void> {
  const promo = await findPromoByCode(code);
  if (!promo) return;
  const usedCount = Number(promo.used_count ?? (promo.used_at ? 1 : 0));
  const maxUses = Number(promo.max_uses ?? 1);
  if (maxUses > 0 && usedCount >= maxUses) return; // jau išnaudotas
  await updatePromoCode({
    ...promo,
    used_at: new Date().toISOString(), // paskutinio panaudojimo laikas
    used_booking_id: booking.id, // paskutinės rezervacijos id
    used_booking_ref: booking.merchant_reference,
    used_count: usedCount + 1,
  });
}
