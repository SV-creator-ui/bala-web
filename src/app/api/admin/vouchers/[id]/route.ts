/**
 * PATCH /api/admin/vouchers/[id]  { action }
 *   action: "redeem" | "reactivate" | "cancel" | "resend"
 * Rankinis dovanų kupono valdymas (apsaugota — reikia admin sesijos).
 */
import { NextResponse } from "next/server";
import { isAuthed, dbConfigured } from "@/lib/admin/auth";
import { updateVoucherStatus } from "@/lib/voucher/store";
import { resendVoucherEmail } from "@/lib/voucher/fulfill";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ error: "DEMO režimas — nėra DB" }, { status: 400 });

  const { id } = await params;
  let body: { action?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }

  try {
    switch (body.action) {
      case "redeem":
        await updateVoucherStatus(id, "redeemed");
        break;
      case "reactivate":
        await updateVoucherStatus(id, "active");
        break;
      case "cancel":
        await updateVoucherStatus(id, "cancelled");
        break;
      case "resend": {
        const ok = await resendVoucherEmail(id);
        if (!ok) return NextResponse.json({ error: "Nepavyko išsiųsti (kuponas neaktyvus arba el. paštas nesukonfigūruotas)" }, { status: 400 });
        break;
      }
      default:
        return NextResponse.json({ error: "Nežinomas veiksmas" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin voucher patch error:", e);
    return NextResponse.json({ error: "Nepavyko atnaujinti" }, { status: 500 });
  }
}
