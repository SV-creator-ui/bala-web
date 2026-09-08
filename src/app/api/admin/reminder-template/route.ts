/**
 * Admin: priminimo laiškų šablonų valdymas (po vieną kiekvienai paslaugai).
 *   GET                     -> grąžina visus tris šablonus { room, game, party }
 *   PUT     { type, ... }   -> išsaugo vieno tipo šabloną
 *   POST    action=test     -> siunčia bandymo laišką pagal tipą (body: { type, to?, template? })
 *   POST    action=run_now  -> paleidžia realų priminimų siuntimą
 * Apsauga: admin sesija (isAuthed).
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import {
  loadAllTemplates, saveTemplate, sendTestReminder, sendDueReminders,
  BOOKING_TYPES, type BookingType, type ReminderTemplate,
} from "@/lib/booking/reminder";
import { adminNotifyAddress } from "@/lib/email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isBookingType(v: unknown): v is BookingType {
  return typeof v === "string" && (BOOKING_TYPES as readonly string[]).includes(v);
}

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  const templates = await loadAllTemplates();
  return NextResponse.json({ templates });
}

export async function PUT(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    const body = (await req.json()) as Partial<ReminderTemplate> & { type?: string };
    if (!isBookingType(body.type)) return NextResponse.json({ error: "Trūksta ar netinkamas type" }, { status: 400 });
    if (typeof body.subject !== "string" || !body.subject.trim())
      return NextResponse.json({ error: "Trūksta antraštės" }, { status: 400 });
    if (typeof body.body_html !== "string" || !body.body_html.trim())
      return NextResponse.json({ error: "Trūksta laiško turinio" }, { status: 400 });
    const tmpl: ReminderTemplate = {
      enabled: Boolean(body.enabled),
      subject: body.subject,
      body_html: body.body_html,
    };
    await saveTemplate(body.type, tmpl);
    return NextResponse.json({ ok: true, type: body.type, template: tmpl });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    const body = (await req.json().catch(() => ({}))) as {
      action?: "test" | "run_now";
      type?: string;
      to?: string;
      template?: ReminderTemplate;
    };
    const action = body.action ?? "test";
    if (action === "run_now") {
      const result = await sendDueReminders({});
      return NextResponse.json({ ok: true, ...result });
    }
    // test
    if (!isBookingType(body.type)) return NextResponse.json({ error: "Trūksta type (room|game|party)" }, { status: 400 });
    const to = (body.to || adminNotifyAddress()).trim();
    if (!to) return NextResponse.json({ error: "Nenurodytas gavėjas" }, { status: 400 });
    await sendTestReminder(to, body.type, body.template);
    return NextResponse.json({ ok: true, sent_to: to, type: body.type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
