/**
 * GET /api/availability?date=YYYY-MM-DD&type=room|party&pkg=maksi&addons=extratime,vrmax
 * Grąžina visų pradžios laikų sąrašą su požymiu, ar tinka pasirinktam
 * rezervacijos tipui (bendras grafikas — atsižvelgiama į trukmę ir buferius).
 */
import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking/availability";
import { validFutureDate, validBookingType } from "@/lib/booking/validation";
import type { BookingType } from "@/lib/booking/config";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "";
  const typeRaw = searchParams.get("type") || "room";
  const type: BookingType = validBookingType(typeRaw) ? typeRaw : "room";
  const packageId = searchParams.get("pkg");
  const addons = (searchParams.get("addons") || "").split(",").map((s) => s.trim()).filter(Boolean);

  if (!validFutureDate(date)) {
    return NextResponse.json({ error: "Netinkama data" }, { status: 400 });
  }

  try {
    const slots = await getAvailability(date, { type, packageId, addons });
    return NextResponse.json({ date, slots });
  } catch (e) {
    console.error("availability error:", e);
    return NextResponse.json({ error: "Nepavyko gauti laisvų laikų" }, { status: 500 });
  }
}
