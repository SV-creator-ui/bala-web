/**
 * POST /api/vouchers/validate  { code }
 * Patikrina, ar dovanų kupono kodas galiojantis (aktyvus + nepasibaigęs).
 * Naudojama rezervacijos formoje — parodyti nuolaidos peržiūrą. Galutinis
 * pritaikymas visada perskaičiuojamas serveryje kuriant rezervaciją.
 *
 * Grąžina detalizuotą klaidos priežastį (pasibaigęs / panaudotas / atšauktas /
 * nerastas), kad klientas suprastų, kas negerai — ypač migruotiems Moizmo
 * kuponams, kurie gali būti pasibaigę pagal originalią galiojimo datą.
 */
import { NextResponse } from "next/server";
import { lookupVoucher } from "@/lib/voucher/store";
import { normalizeVoucherCode } from "@/lib/voucher/config";
import { venueNow } from "@/lib/booking/config";

export const dynamic = "force-dynamic";

const MONTHS = [
  "sausio", "vasario", "kovo", "balandžio", "gegužės", "birželio",
  "liepos", "rugpjūčio", "rugsėjo", "spalio", "lapkričio", "gruodžio",
];

/** YYYY-MM-DD -> „2026 m. spalio 23 d." */
function fmtDateLT(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${y} m. ${MONTHS[m - 1]} ${d} d.`;
}

export async function POST(req: Request) {
  let body: { code?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, error: "Netinkami duomenys" }, { status: 400 });
  }

  const code = normalizeVoucherCode(String(body.code || ""));
  if (!code) return NextResponse.json({ valid: false, error: "Įveskite kodą" }, { status: 400 });

  const v = await lookupVoucher(code);
  if (!v) {
    return NextResponse.json({ valid: false, error: "Kuponas nerastas — patikrinkite kodą" });
  }

  const today = venueNow().date;
  const amount = Number(v.amount_eur);
  const validUntil = v.valid_until;

  // Pasibaigęs — arba statusu „expired", arba pagal datą
  if (v.status === "expired" || (validUntil && validUntil < today)) {
    return NextResponse.json({
      valid: false,
      error: validUntil
        ? `Kuponas (${amount} €) pasibaigęs ${fmtDateLT(validUntil)}. Susisiekite: +370 684 26686`
        : `Kuponas (${amount} €) pasibaigęs. Susisiekite: +370 684 26686`,
      amount,
      validUntil,
    });
  }

  if (v.status === "redeemed") {
    return NextResponse.json({
      valid: false,
      error: `Kuponas (${amount} €) jau panaudotas`,
    });
  }

  if (v.status === "cancelled") {
    return NextResponse.json({
      valid: false,
      error: "Kuponas atšauktas",
    });
  }

  if (v.status !== "active") {
    return NextResponse.json({
      valid: false,
      error: "Kuponas negalioja",
    });
  }

  return NextResponse.json({
    valid: true,
    amount,
    validUntil,
  });
}
