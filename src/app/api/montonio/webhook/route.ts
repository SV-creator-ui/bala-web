/**
 * NEBENAUDOJAMA. Mokėjimai perkelti į Paysera — žr. /api/paysera/callback.
 * Šis senas Montonio webhook'as paliktas tik kaip „410 Gone" atsakas.
 */
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  return NextResponse.json({ error: "Montonio webhook nebenaudojamas. Naudokite /api/paysera/callback." }, { status: 410 });
}
