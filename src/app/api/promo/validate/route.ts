/**
 * POST /api/promo/validate
 * Kliento pusėje kviečiama tikrinti promo kodą PRIEŠ apmokėjimą.
 * Grąžina nuolaidos dydį EUR ir žmogui suprantamą klaidą jei negalioja.
 *
 * Body: { code, email, type, total, hasVoucher }
 */
import { NextResponse } from "next/server";
import { validatePromoForBooking } from "@/lib/promo/redeem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      code?: string; email?: string; type?: string; total?: number; hasVoucher?: boolean;
    };
    const type = body.type === "party" || body.type === "game" ? body.type : "room";
    const total = Number(body.total || 0);
    if (!body.code || !body.email || !total) {
      return NextResponse.json({ ok: false, error: "Trūksta duomenų" }, { status: 400 });
    }
    const v = await validatePromoForBooking({
      code: body.code, email: body.email, type, total, hasVoucher: !!body.hasVoucher,
    });
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error });
    return NextResponse.json({
      ok: true,
      discount: v.discount,
      code: v.promo.code,
      discount_type: v.promo.discount_type,
      discount_value: v.promo.discount_value,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
