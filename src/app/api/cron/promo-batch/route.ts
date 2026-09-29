/**
 * Vienkartinis „Ačiū už šventę" siuntimas (rankinis). Gyvoje svetainėje IŠJUNGTAS —
 * veikia tik kai nustatyta PROMO_BATCH_ENABLED=1 (naudojama lokaliai).
 *
 * Parametrai:
 *   key=<CRON_SECRET>   (privalomas)
 *   since=YYYY-MM-DD    šventės nuo šios datos (numatyta 2026-08-01)
 *   test=<email>        išsiunčia vieną bandomąjį laišką į šį adresą (DB nerašo)
 *   send=1              REALIAI siunčia visiems; be jo — tik peržiūra (dry-run)
 *   campaign=return     vietoj „Ačiū už šventę" siunčia „Dar vienas nuotykis" (−15%) kambarių/žaidimų klientams
 */
import { NextResponse } from "next/server";
import { runPartyThanksBatch, runReturnOfferBatch } from "@/lib/promo/generator";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (process.env.PROMO_BATCH_ENABLED !== "1") return new NextResponse("Not found", { status: 404 });
  const secret = process.env.CRON_SECRET;
  const url = new URL(req.url);
  if (!secret || url.searchParams.get("key") !== secret) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  }
  const since = url.searchParams.get("since") || "2026-08-01";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(since)) return NextResponse.json({ error: "Bloga data" }, { status: 400 });
  const testTo = url.searchParams.get("test") || undefined;
  const send = url.searchParams.get("send") === "1";
  try {
    const campaign = url.searchParams.get("campaign") === "return" ? "return" : "thanks";
    const result = campaign === "return"
      ? await runReturnOfferBatch({ dryRun: !send, testTo })
      : await runPartyThanksBatch({ since, dryRun: !send, testTo });
    return NextResponse.json({ ok: true, campaign, mode: testTo ? "test" : send ? "SEND" : "dry-run", ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[promo-batch] klaida:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
