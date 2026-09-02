/**
 * POST /api/vouchers
 * Sukuria „pending" dovanų kuponą, inicijuoja Montonio mokėjimą VISAI kupono
 * sumai ir grąžina apmokėjimo nuorodą. Apmokėjus (webhook / grįžimo puslapis)
 * kuponas aktyvuojamas ir PDF išsiunčiamas pirkėjui.
 *
 * SVARBU: suma validuojama serveryje — klientui nepasitikime.
 */
import { NextResponse } from "next/server";
import { validName, validEmail } from "@/lib/booking/validation";
import { validVoucherAmount } from "@/lib/voucher/config";
import { createVoucher, setMontonioUuid } from "@/lib/voucher/store";
import { fulfillVoucherByRef } from "@/lib/voucher/fulfill";
import { createPayseraPayment, payseraConfigured, bookingTestMode } from "@/lib/paysera";

export const dynamic = "force-dynamic";

const CONFIRM_PATH = "/pabegimo-kambariai/dovanu-kuponas/patvirtinta";

function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }

  const amount = Number(body.amount);
  const buyerName = String(body.buyerName || "");
  const buyerEmail = String(body.buyerEmail || "");
  const recipientName = body.recipientName ? String(body.recipientName).slice(0, 80) : null;
  const fromName = body.fromName ? String(body.fromName).slice(0, 80) : null;
  const message = body.message ? String(body.message).slice(0, 300) : null;

  const errors: string[] = [];
  if (!validVoucherAmount(amount)) errors.push("suma");
  if (!validName(buyerName)) errors.push("vardas");
  if (!validEmail(buyerEmail)) errors.push("el. paštas");
  if (errors.length) {
    return NextResponse.json({ error: "Netinkami laukai: " + errors.join(", ") }, { status: 400 });
  }

  const paymentReady = payseraConfigured();
  const testMode = bookingTestMode();
  if (!paymentReady && !testMode) {
    return NextResponse.json(
      { error: "Mokėjimai laikinai nesukonfigūruoti. Susisiekite su mumis." },
      { status: 503 },
    );
  }

  try {
    const merchantReference = `GIFT-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const voucher = await createVoucher({
      amount,
      buyerName: buyerName.trim(),
      buyerEmail: buyerEmail.trim(),
      recipientName,
      fromName,
      message,
      merchantReference,
      paidImmediately: !paymentReady, // testavimo režimas — iškart aktyvus
    });

    // --- Testavimo režimas: praleidžiam mokėjimą, iškart aktyvuojam + siunčiam ---
    if (!paymentReady) {
      await fulfillVoucherByRef(merchantReference); // PDF pirkėjui (jei el. paštas sukonfigūruotas)
      return NextResponse.json({
        paymentUrl: `${CONFIRM_PATH}?ref=${encodeURIComponent(merchantReference)}&test=1`,
        merchantReference,
        test: true,
      });
    }

    // --- Paysera mokėjimas (visa kupono suma) ---
    const base = siteUrl(req);
    const pay = await createPayseraPayment({
      merchantReference,
      amount,
      acceptUrl: `${base}${CONFIRM_PATH}?ref=${encodeURIComponent(merchantReference)}`,
      cancelUrl: `${base}/pabegimo-kambariai/dovanu-kuponas?cancel=1`,
      callbackUrl: `${base}/api/paysera/callback`,
      description: `BALA VR dovanų kuponas — ${amount} €`,
      email: buyerEmail.trim(),
    });
    await setMontonioUuid(voucher.id, pay.orderId); // Paysera order id

    return NextResponse.json({ paymentUrl: pay.paymentUrl, merchantReference });
  } catch (e) {
    console.error("voucher purchase error:", e);
    return NextResponse.json(
      { error: "Nepavyko sukurti kupono. Bandykite dar kartą." },
      { status: 500 },
    );
  }
}
