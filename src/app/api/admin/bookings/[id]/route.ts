/**
 * PATCH /api/admin/bookings/[id]  — pakeisti būseną ({ status })
 * Leidžiamos būsenos: paid, cancelled, pending.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { updateBookingStatus, type BookingStatus } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

const ALLOWED: BookingStatus[] = ["paid", "cancelled", "pending"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });

  const { id } = await params;
  let body: { status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }
  const status = body.status as BookingStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Netinkama būsena" }, { status: 400 });
  }

  try {
    await updateBookingStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin update booking error:", e);
    return NextResponse.json({ error: "Nepavyko atnaujinti" }, { status: 500 });
  }
}
