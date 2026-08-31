/**
 * POST /api/montonio/webhook
 * Montonio praneša apie mokėjimo būseną. Patikriname parašą ir, jei apmokėta,
 * pažymime rezervaciją kaip "paid".
 *
 * Montonio kartoja webhook'ą iki 13 kartų per 48 val., jei negauna HTTP 200.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { verifyMontonioToken } from "@/lib/montonio";
import { syncBookingCalendarByRef } from "@/lib/booking/calendar-sync";
import { notifyBookingPaidByRef } from "@/lib/booking/notify";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orderToken?: string };
    const token = body.orderToken;
    if (!token) return NextResponse.json({ error: "Nėra orderToken" }, { status: 400 });

    const payload = await verifyMontonioToken(token); // meta klaidą, jei parašas blogas
    const ref = payload.merchantReference;
    if (!ref) return NextResponse.json({ error: "Nėra merchantReference" }, { status: 400 });

    if (payload.paymentStatus === "PAID") {
      const supabase = getSupabaseAdmin();
      await supabase
        .from("bookings")
        .update({ status: "paid" })
        .eq("merchant_reference", ref)
        .eq("status", "pending"); // tik jei dar nebuvo apmokėta
      await syncBookingCalendarByRef(ref); // į Google Calendar (jei sukonfigūruota)
      await notifyBookingPaidByRef(ref); // patvirtinimo laiškai klientui + adminui
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("montonio webhook error:", e);
    // Grąžiname 400, kad Montonio bandytų dar kartą, jei tai laikina klaida
    return NextResponse.json({ error: "Webhook klaida" }, { status: 400 });
  }
}
