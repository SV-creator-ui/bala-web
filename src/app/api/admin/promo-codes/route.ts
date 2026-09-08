/**
 * Admin: promo kodų valdymas.
 *  GET     -> visų kodų sąrašas (naujausi viršuje)
 *  POST    -> rankinis kodo kūrimas (Black Friday, studentai ir pan.)
 *  PATCH   -> kodo atšaukimas / atkūrimas / pratęsimas (body: { code, action })
 * Apsauga: admin sesija.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import {
  listPromoCodes, insertPromoCode, findPromoByCode, updatePromoCode,
  generateCodeString,
  type PromoCode, type PromoKind, type PromoAppliesTo,
} from "@/lib/promo/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  const codes = await listPromoCodes();
  codes.sort((a, b) => (b.issued_at || "").localeCompare(a.issued_at || ""));
  return NextResponse.json({ codes });
}

/**
 * Rankinis MASINIO kodo kūrimas — pvz. Black Friday, Kalėdos, studentams (visai grupei).
 * Vienas kodas, kurį gali įvesti bet kuris klientas (be email apribojimo).
 * Panaudojimų limitas gali būti nustatomas (0 = neribotai).
 */
export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    const body = (await req.json()) as {
      customCode?: string;
      discountType?: "percent" | "fixed";
      discountValue?: number;
      appliesTo?: string[];
      validDays?: number; // nuo šiandien
      maxUses?: number; // 0 = neribotai
    };

    const value = Number(body.discountValue);
    if (!Number.isFinite(value) || value <= 0) return NextResponse.json({ error: "Netinkama nuolaidos vertė" }, { status: 400 });
    const discountType = body.discountType === "fixed" ? "fixed" : "percent";
    if (discountType === "percent" && value > 100) return NextResponse.json({ error: "% nuolaida negali viršyti 100" }, { status: 400 });

    const appliesTo = (Array.isArray(body.appliesTo) ? body.appliesTo : ["room", "game"])
      .filter((t) => t === "room" || t === "game" || t === "party") as PromoAppliesTo[];
    if (appliesTo.length === 0) return NextResponse.json({ error: "Nurodyk bent vieną paslaugą" }, { status: 400 });

    const days = Math.max(1, Math.min(365, Number(body.validDays) || 30));
    const today = new Date().toISOString().slice(0, 10);
    const validUntil = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);

    let code = (body.customCode || "").trim().toUpperCase();
    if (code) {
      if (!/^[A-Z0-9\-_]{3,32}$/.test(code)) {
        return NextResponse.json({ error: "Kodas gali turėti tik raides, skaičius, - ir _ (3–32 simboliai)" }, { status: 400 });
      }
      const exists = await findPromoByCode(code);
      if (exists) return NextResponse.json({ error: "Toks kodas jau egzistuoja" }, { status: 400 });
    } else {
      code = generateCodeString("SUGRIZK").replace("SUGRIZK", "PROMO");
    }

    const maxUses = Math.max(0, Math.min(100000, Number(body.maxUses) || 0));

    const promo: PromoCode = {
      code,
      kind: "manual" as PromoKind,
      discount_type: discountType,
      discount_value: value,
      assigned_email: "", // MASINIS — be email apribojimo
      applies_to: appliesTo,
      valid_from: today,
      valid_until: validUntil,
      issued_at: new Date().toISOString(),
      used_at: null, used_booking_id: null, used_booking_ref: null,
      source_booking_id: null,
      cancelled: false,
      min_visits_required: 0,
      allow_voucher_stack: false,
      max_uses: maxUses,
      used_count: 0,
    };
    await insertPromoCode(promo);
    return NextResponse.json({ ok: true, code: promo });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** Kodo atšaukimas / atkūrimas / galiojimo pratęsimas. */
export async function PATCH(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    const body = (await req.json()) as {
      code?: string;
      action?: "cancel" | "reactivate" | "extend";
      extendDays?: number;
    };
    const code = (body.code || "").trim().toUpperCase();
    if (!code) return NextResponse.json({ error: "Trūksta kodo" }, { status: 400 });
    const promo = await findPromoByCode(code);
    if (!promo) return NextResponse.json({ error: "Kodas nerastas" }, { status: 404 });

    if (body.action === "cancel") {
      await updatePromoCode({ ...promo, cancelled: true });
    } else if (body.action === "reactivate") {
      await updatePromoCode({ ...promo, cancelled: false });
    } else if (body.action === "extend") {
      const days = Math.max(1, Math.min(365, Number(body.extendDays) || 30));
      const newUntil = new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
      await updatePromoCode({ ...promo, valid_until: newUntil });
    } else {
      return NextResponse.json({ error: "Nežinomas veiksmas" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
