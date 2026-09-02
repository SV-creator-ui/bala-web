/**
 * POST /api/vouchers/validate  { code }
 * Patikrina, ar dovanų kupono kodas galiojantis (aktyvus + nepasibaigęs).
 * Naudojama rezervacijos formoje — parodyti nuolaidos peržiūrą. Galutinis
 * pritaikymas visada perskaičiuojamas serveryje kuriant rezervaciją.
 */
import { NextResponse } from "next/server";
import { getRedeemableVoucher } from "@/lib/voucher/store";
import { normalizeVoucherCode } from "@/lib/voucher/config";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Netinkami duomenys" }, { status: 400 });
  }

  const code = normalizeVoucherCode(String(body.code || ""));
  if (!code) return NextResponse.json({ valid: false, error: "Įveskite kodą" }, { status: 400 });

  const v = await getRedeemableVoucher(code);
  if (!v) {
    return NextResponse.json({ valid: false, error: "Kuponas negalioja arba jau panaudotas" });
  }
  return NextResponse.json({ valid: true, amount: Number(v.amount_eur) });
}
