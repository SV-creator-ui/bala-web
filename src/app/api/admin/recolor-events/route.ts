/**
 * POST /api/admin/recolor-events
 * Vienkartinis įrankis — perspalvina JAU esamus Google Calendar įvykius pagal
 * dabartinę schemą (party→žalia, game→oranžinė, room→mėlyna). Nauji įvykiai
 * spalvą gauna automatiškai per `syncBookingEvent`; ši rutina užpildo istoriją.
 *
 * Elgesys: eina per visas rezervacijas su `gcal_event_id`, kiekvienam siunčia
 * MINIMALŲ PATCH `{colorId}` — kiti laukai (summary, description) NEKEIČIAMI,
 * kad išliktų rankomis padaryti pakeitimai kalendoriuje.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { listBookings } from "@/lib/admin/data";
import {
  googleCalendarConfigured,
  __debugGetAccessToken as getAccessToken,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

function colorIdFor(type: string): string {
  if (type === "party") return "10"; // Basil — žalia
  if (type === "game") return "6"; // Tangerine — oranžinė
  return "9"; // Blueberry — mėlyna (room)
}

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  }
  if (!googleCalendarConfigured()) {
    return NextResponse.json({ error: "Google Calendar nesukonfigūruotas" }, { status: 400 });
  }

  const bookings = await listBookings({});
  const withEvent = bookings.filter((b) => b.gcal_event_id);
  const token = await getAccessToken();
  const calId = process.env.GOOGLE_CALENDAR_ID || "";
  const base = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`;

  let updated = 0;
  let missing = 0;
  const errors: Array<{ id: string; ref: string; status: number; message: string }> = [];

  for (const b of withEvent) {
    const colorId = colorIdFor(b.type);
    try {
      const res = await fetch(`${base}/${encodeURIComponent(b.gcal_event_id!)}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ colorId }),
      });
      if (res.ok) {
        updated += 1;
      } else if (res.status === 404 || res.status === 410) {
        missing += 1; // įvykis buvo ištrintas rankomis — praleidžiam tyliai
      } else {
        errors.push({
          id: b.id,
          ref: b.merchant_reference,
          status: res.status,
          message: (await res.text().catch(() => "")).slice(0, 200),
        });
      }
    } catch (e) {
      errors.push({
        id: b.id,
        ref: b.merchant_reference,
        status: 0,
        message: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({
    totalBookings: bookings.length,
    withEventId: withEvent.length,
    updated,
    missing,
    failed: errors.length,
    errors,
  });
}
