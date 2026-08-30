/**
 * POST   /api/admin/session  — prisijungimas ({ password })
 * DELETE /api/admin/session  — atsijungimas
 */
import { NextResponse } from "next/server";
import { checkPassword, createSessionToken, adminLocked, SESSION_COOKIE } from "@/lib/admin/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  if (adminLocked()) {
    return NextResponse.json(
      { error: "Admin prieiga užrakinta. Nustatykite ADMIN_PASSWORD aplinkos kintamąjį." },
      { status: 403 },
    );
  }
  let body: { password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }
  if (!checkPassword(body.password || "")) {
    return NextResponse.json({ error: "Neteisingas slaptažodis" }, { status: 401 });
  }
  const token = await createSessionToken();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
