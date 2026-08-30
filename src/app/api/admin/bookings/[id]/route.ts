/**
 * PATCH /api/admin/bookings/[id]
 *   - Būsenos keitimas: { status }  (paid | cancelled | pending)
 *   - Perkėlimas:       { date, time }  (į kitą laisvą seansą)
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { updateBookingStatus, rescheduleBooking, type BookingStatus } from "@/lib/admin/data";
import { isSlotAvailable } from "@/lib/booking/availability";
import { generateSlots } from "@/lib/booking/config";
import { validFutureDate } from "@/lib/booking/validation";

export const dynamic = "force-dynamic";

const ALLOWED: BookingStatus[] = ["paid", "cancelled", "pending"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });

  const { id } = await params;
  let body: { status?: string; date?: string; time?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }

  // --- Perkėlimas į kitą laiką ---
  if (body.date || body.time) {
    const date = String(body.date || "");
    const time = String(body.time || "");
    if (!validFutureDate(date) || !generateSlots().includes(time)) {
      return NextResponse.json({ error: "Netinkama data arba laikas" }, { status: 400 });
    }
    try {
      if (!(await isSlotAvailable(date, time))) {
        return NextResponse.json({ error: "Šis laikas jau užimtas. Pasirinkite kitą." }, { status: 409 });
      }
      await rescheduleBooking(id, date, time);
      return NextResponse.json({ ok: true });
    } catch (e) {
      console.error("admin reschedule error:", e);
      return NextResponse.json({ error: "Nepavyko perkelti" }, { status: 500 });
    }
  }

  // --- Būsenos keitimas ---
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
