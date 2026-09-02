/**
 * GET /api/admin/vouchers?status=
 * Grąžina dovanų kuponus (apsaugota — reikia admin sesijos).
 */
import { NextResponse } from "next/server";
import { isAuthed, dbConfigured } from "@/lib/admin/auth";
import { listVouchers } from "@/lib/voucher/store";
import type { VoucherRow } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  if (!dbConfigured()) return NextResponse.json({ vouchers: [] }); // DEMO — nėra DB

  const { searchParams } = new URL(req.url);
  const status = (searchParams.get("status") || "all") as VoucherRow["status"] | "all";

  try {
    const vouchers = await listVouchers({ status });
    return NextResponse.json({ vouchers });
  } catch (e) {
    console.error("admin vouchers error:", e);
    return NextResponse.json({ error: "Nepavyko gauti kuponų" }, { status: 500 });
  }
}
