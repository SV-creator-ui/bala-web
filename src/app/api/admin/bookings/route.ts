/**
 * GET /api/admin/bookings?from=&to=&status=
 * Grąžina rezervacijas (apsaugota — reikia admin sesijos).
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { listBookings, type BookingStatus } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from") || undefined;
  const to = searchParams.get("to") || undefined;
  const status = (searchParams.get("status") || "all") as BookingStatus | "all";

  try {
    const bookings = await listBookings({ from, to, status });
    return NextResponse.json({ bookings });
  } catch (e) {
    console.error("admin bookings error:", e);
    return NextResponse.json({ error: "Nepavyko gauti rezervacijų" }, { status: 500 });
  }
}
