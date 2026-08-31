/**
 * Rezervacijos patvirtinimo „resolve" logika — bendra pabėgimo kambarių ir
 * gimtadienių patvirtinimo puslapiams. Tik serveriui (Supabase + Montonio).
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { verifyMontonioToken, bookingTestMode } from "@/lib/montonio";

export type ResolveResult = { status: "paid" | "pending" | "error"; booking?: BookingRow };

/** Iš Montonio grįžimo/webhook order-token'o. */
export async function resolveBooking(token: string | undefined): Promise<ResolveResult> {
  if (!token) return { status: "error" };
  try {
    const payload = await verifyMontonioToken(token);
    const ref = payload.merchantReference;
    if (!ref) return { status: "error" };

    const supabase = getSupabaseAdmin();

    // Jei apmokėta — pažymime paid (idempotentiškai; webhook gali dar nespėti)
    if (payload.paymentStatus === "PAID") {
      await supabase.from("bookings").update({ status: "paid" }).eq("merchant_reference", ref).eq("status", "pending");
    }

    const { data } = await supabase.from("bookings").select("*").eq("merchant_reference", ref).single();
    const booking = data as BookingRow | null;
    if (!booking) return { status: "error" };
    return { status: booking.status === "paid" ? "paid" : "pending", booking };
  } catch {
    return { status: "error" };
  }
}

/** Testavimo režimas — paieška pagal merchant_reference (be Montonio). */
export async function resolveByRef(ref: string | undefined): Promise<ResolveResult> {
  if (!ref || !bookingTestMode()) return { status: "error" };
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

/** searchParams -> { token, ref } */
export function readConfirmParams(sp: Record<string, string | string[] | undefined>): { token?: string; ref?: string } {
  const tokenRaw = sp["order-token"] ?? sp["order_token"];
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const refRaw = sp["ref"];
  const ref = Array.isArray(refRaw) ? refRaw[0] : refRaw;
  return { token, ref };
}
