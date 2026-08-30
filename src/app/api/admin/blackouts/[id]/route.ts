/**
 * DELETE /api/admin/blackouts/[id] — pašalinti užblokuotą laiką
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { removeBlackout } from "@/lib/admin/data";

export const dynamic = "force-dynamic";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  const { id } = await params;
  try {
    await removeBlackout(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("admin remove blackout error:", e);
    return NextResponse.json({ error: "Nepavyko pašalinti" }, { status: 500 });
  }
}
