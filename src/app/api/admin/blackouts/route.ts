/**
 * GET  /api/admin/blackouts  — užblokuotų laikų sąrašas
 * POST /api/admin/blackouts  — pridėti ({ date, time?, reason? })
 *   time = null (arba nenurodyta) reiškia užblokuotą visą dieną.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { listBlackouts, addBlackout } from "@/lib/admin/data";
import { generateSlots } from "@/lib/booking/config";
import { validFutureDate } from "@/lib/booking/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  try {
    return NextResponse.json({ blackouts: await listBlackouts() });
  } catch (e) {
    console.error("admin blackouts error:", e);
    return NextResponse.json({ error: "Nepavyko gauti" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  let body: { date?: string; time?: string | null; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }
  const date = String(body.date || "");
  const time = body.time ? String(body.time) : null;
  const reason = body.reason ? String(body.reason).slice(0, 200) : null;

  if (!validFutureDate(date)) return NextResponse.json({ error: "Netinkama data" }, { status: 400 });
  if (time && !generateSlots().includes(time)) return NextResponse.json({ error: "Netinkamas laikas" }, { status: 400 });

  try {
    await addBlackout(date, time, reason);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin add blackout error:", e);
    return NextResponse.json({ error: "Nepavyko pridėti" }, { status: 500 });
  }
}
