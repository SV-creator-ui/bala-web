/**
 * GET /api/admin/calendar-debug?date=YYYY-MM-DD
 * Diagnostikos endpoint'as — parodo, ką Google Calendar grąžina konkrečiai datai
 * ir ar konfigūracija apskritai suveikia.
 * Apsaugotas — reikia admin sesijos.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import {
  googleCalendarConfigured,
  fetchCalendarBusyForDate,
  listAccessibleCalendars,
  __debugGetAccessToken as getAccessToken,
} from "@/lib/google-calendar";

export const dynamic = "force-dynamic";

/**
 * Tiesioginis Google API iškvietimas — grąžina RAW atsakymą, kad matytume
 * ar problema su prieiga, autentifikacija, ar kažkuo kitu.
 */
async function rawEventsCall(date: string): Promise<Record<string, unknown>> {
  try {
    const token = await getAccessToken();
    const calId = process.env.GOOGLE_CALENDAR_ID || "";
    const dayStartUtc = new Date(`${date}T00:00:00Z`);
    const timeMin = new Date(dayStartUtc.getTime() - 12 * 3600_000).toISOString();
    const timeMax = new Date(dayStartUtc.getTime() + 36 * 3600_000).toISOString();
    const url = new URL(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events`,
    );
    url.searchParams.set("timeMin", timeMin);
    url.searchParams.set("timeMax", timeMax);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");
    url.searchParams.set("maxResults", "10");

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {}
    return {
      urlCalledForCalendarId: calId,
      httpStatus: res.status,
      httpStatusText: res.statusText,
      body,
    };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

  const configured = googleCalendarConfigured();
  const envCheck = {
    GOOGLE_CALENDAR_ID: !!process.env.GOOGLE_CALENDAR_ID,
    GOOGLE_SA_EMAIL: !!process.env.GOOGLE_SA_EMAIL,
    GOOGLE_SA_PRIVATE_KEY: !!process.env.GOOGLE_SA_PRIVATE_KEY,
    GOOGLE_CALENDAR_ID_value: process.env.GOOGLE_CALENDAR_ID || null,
    GOOGLE_SA_EMAIL_value: process.env.GOOGLE_SA_EMAIL || null,
  };

  if (!configured) {
    return NextResponse.json({
      configured: false,
      envCheck,
      date,
      hint: "Trūksta kintamųjų. Patikrink Vercel env vars ir Redeploy.",
    });
  }

  try {
    const [events, calendars, rawEventsResult] = await Promise.all([
      fetchCalendarBusyForDate(date, new Set()),
      listAccessibleCalendars(),
      rawEventsCall(date),
    ]);
    return NextResponse.json({
      configured: true,
      envCheck,
      date,
      accessibleCalendars: calendars,
      accessibleCalendarsHint:
        "Jei čia sąrašas TUŠČIAS — kalendorius nesudalintas su service account. " +
        "Jei čia matai bala.pramogos@gmail.com — dalinimasis OK. " +
        "Jei matai kitą (pvz. Moizmo dedikuotą) — reikia pakeisti GOOGLE_CALENDAR_ID į jo id.",
      eventsCount: events.length,
      events: events.map((e) => ({
        summary: e.summary,
        eventId: e.eventId,
        startMin: e.startMin,
        endMin: e.endMin,
        startTime: `${String(Math.floor(e.startMin / 60)).padStart(2, "0")}:${String(e.startMin % 60).padStart(2, "0")}`,
        endTime: `${String(Math.floor(e.endMin / 60)).padStart(2, "0")}:${String(e.endMin % 60).padStart(2, "0")}`,
      })),
      rawEventsCall: rawEventsResult,
    });
  } catch (e) {
    return NextResponse.json({
      configured: true,
      envCheck,
      date,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
