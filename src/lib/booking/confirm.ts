/**
 * Rezervacijos patvirtinimo „resolve" logika — bendra visiems patvirtinimo
 * puslapiams. Tik serveriui (Supabase).
 *
 * Paysera po apmokėjimo grąžina klientą į accepturl su mūsų `?ref=` parametru;
 * o apmokėjimą autoritetingai patvirtina serverio-serveriui callback'as
 * (/api/paysera/callback), kuris pažymi rezervaciją „paid". Todėl čia tiesiog
 * ieškome pagal merchant_reference ir rodome esamą būseną.
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";

export type ResolveResult = { status: "paid" | "pending" | "error"; booking?: BookingRow };

/**
 * Palikta suderinamumui — Paysera nenaudoja „order-token", tad šis kelias
 * praktiškai nebenaudojamas (puslapiai kviečia resolveByRef).
 */
export async function resolveBooking(_token: string | undefined): Promise<ResolveResult> {
  return { status: "error" };
}

/** Paieška pagal merchant_reference. */
export async function resolveByRef(ref: string | undefined): Promise<ResolveResult> {
  if (!ref) return { status: "error" };
  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase.from("bookings").select("*").eq("merchant_reference", ref).single();
    const booking = data as BookingRow | null;
    if (!booking) return { status: "error" };
    return { status: booking.status === "paid" ? "paid" : "pending", booking };
  } catch {
    return { status: "error" };
  }
}

/** searchParams -> { token, ref }. `token` lieka suderinamumui (Paysera nenaudoja). */
export function readConfirmParams(sp: Record<string, string | string[] | undefined>): { token?: string; ref?: string } {
  const tokenRaw = sp["order-token"] ?? sp["order_token"];
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const refRaw = sp["ref"];
  const ref = Array.isArray(refRaw) ? refRaw[0] : refRaw;
  return { token, ref };
}
