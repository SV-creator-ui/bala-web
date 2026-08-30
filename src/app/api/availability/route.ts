/**
 * GET /api/availability?date=YYYY-MM-DD
 * Grąžina visų seansų sąrašą su požymiu, ar laisvas.
 */
import { NextResponse } from "next/server";
import { getAvailability } from "@/lib/booking/availability";
import { validFutureDate } from "@/lib/booking/validation";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || "";

  if (!validFutureDate(date)) {
    return NextResponse.json({ error: "Netinkama data" }, { status: 400 });
  }

  try {
    const slots = await getAvailability(date);
    return NextResponse.json({ date, slots });
  } catch (e) {
    console.error("availability error:", e);
    return NextResponse.json({ error: "Nepavyko gauti laisvų laikų" }, { status: 500 });
  }
}
