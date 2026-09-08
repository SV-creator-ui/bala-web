/**
 * Vercel Cron endpoint — siunčia rytojaus rezervacijų priminimus.
 * Konfigūruojama vercel.json'e (kartą per parą, ~10:00 Vilnius).
 *
 * Apsauga:
 *  - Vercel Cron automatiškai prideda „Authorization: Bearer $CRON_SECRET".
 *  - Rankiniam paleidimui galima ?key=$CRON_SECRET (jei nustatytas).
 *  - Jei CRON_SECRET nenustatytas — endpoint'as viešas (naudoti tik dev).
 */
import { NextResponse } from "next/server";
import { sendDueReminders } from "@/lib/booking/reminder";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: leidžiama viskas
  const auth = req.headers.get("authorization") || "";
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(req.url);
  if (url.searchParams.get("key") === secret) return true;
  return false;
}

export async function GET(req: Request) {
  if (!authorized(req)) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dry") === "1";
    const result = await sendDueReminders({ dryRun });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron/reminders] klaida:", msg);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
