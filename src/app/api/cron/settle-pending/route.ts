/**
 * GET /api/cron/settle-pending
 *
 * Fallback grandine, kai Paysera webhook nesuveikia arba klientas užvertė
 * naršyklę prieš grįždamas į patvirtinimo puslapį. Pravažiuoja per pastarų
 * dienų `pending` rezervacijas (su Paysera order id saugotu `montonio_uuid`
 * stulpelyje), pasitikslina Paysera GET /orders/{id} — jei sistema pilnai
 * apmokėta, kviečia `markPaidByRef` (atlieka status update, Google kalendorių,
 * el. laiškus, kvietimų PDF).
 *
 * Autentifikacija:
 *  - Vercel Cron: automatiškai prisega `Authorization: Bearer $CRON_SECRET`
 *    header'į kai `CRON_SECRET` env kintamasis nustatytas.
 *  - Išorinis cron (cron-job.org, EasyCron, GitHub Actions): tuo pačiu
 *    Bearer token'u — reikia perduoti `Authorization: Bearer <CRON_SECRET>`.
 *  - Jei `CRON_SECRET` nenustatytas — endpoint'as viešai neprieinamas
 *    (grąžina 500, kad nebūtų atsitiktinai atkurtų srautų be autorizacijos).
 *
 * Grąžina JSON su statistika (`checked`, `settled`, `still_pending`, `paysera_errors`).
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { payseraConfigured, getPayseraOrderStatus, isPaidStatus } from "@/lib/paysera";
import { markPaidByRef } from "@/lib/booking/settle";
import { BookingPaymentConflictError } from "@/lib/booking/conflict";
import { dbConfigured } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

/** Kiek dienų atgal apžvelgti pending rezervacijas (pakanka su rezerva). */
const LOOKBACK_DAYS = 7;

function unauthorized() {
  return new NextResponse("unauthorized", { status: 401 });
}

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // Saugu by default: be secret'o niekas negali paleisti fallback'o.
    return new NextResponse("CRON_SECRET nenustatytas", { status: 500 });
  }
  const auth = req.headers.get("authorization") || "";
  const provided = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (provided !== secret) return unauthorized();

  if (!dbConfigured() || !payseraConfigured()) {
    return NextResponse.json({ ok: true, skipped: "not-configured" });
  }

  const supabase = getSupabaseAdmin();
  const since = new Date(Date.now() - LOOKBACK_DAYS * 86400_000).toISOString();
  const { data, error } = await supabase
    .from("bookings")
    .select("id,merchant_reference,montonio_uuid,status,customer_name,date,time")
    .in("status", ["pending", "expired"]) // ir expired — mano fix'as leidžia atkurti
    .gte("created_at", since)
    .not("montonio_uuid", "is", null);
  if (error) {
    console.error("[cron settle-pending] DB klaida:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as Pick<BookingRow, "id" | "merchant_reference" | "montonio_uuid" | "status" | "customer_name" | "date" | "time">[];
  const settled: { ref: string; name: string; date: string; time: string }[] = [];
  const stillPending: string[] = [];
  const payseraErrors: string[] = [];
  const paymentConflicts: string[] = [];

  for (const r of rows) {
    if (!r.montonio_uuid) continue;
    try {
      const st = await getPayseraOrderStatus(r.montonio_uuid);
      if (isPaidStatus(st)) {
        await markPaidByRef(r.merchant_reference);
        settled.push({ ref: r.merchant_reference, name: r.customer_name, date: r.date, time: r.time });
        console.log(`[cron settle-pending] ATKURTA ${r.merchant_reference} (${r.customer_name} ${r.date} ${r.time})`);
      } else {
        stillPending.push(r.merchant_reference);
      }
    } catch (e) {
      if (e instanceof BookingPaymentConflictError) {
        paymentConflicts.push(r.merchant_reference);
        console.error(`[cron settle-pending] Reikalinga rankinė mokėjimo peržiūra: ${r.merchant_reference}`);
        continue;
      }
      payseraErrors.push(r.merchant_reference);
      console.error(`[cron settle-pending] Paysera klaida ${r.merchant_reference}:`, e);
    }
  }

  const result = {
    ok: true,
    checked: rows.length,
    settled: settled.length,
    settled_refs: settled,
    still_pending: stillPending.length,
    paysera_errors: payseraErrors.length,
    payment_conflicts: paymentConflicts,
    at: new Date().toISOString(),
  };
  console.log(`[cron settle-pending] ${JSON.stringify(result)}`);
  return NextResponse.json(result);
}
