/**
 * POST /api/bookings
 * Sukuria "pending" rezervaciją, inicijuoja Montonio avanso mokėjimą ir
 * grąžina apmokėjimo nuorodą (paymentUrl).
 *
 * SVARBU: kaina IR avansas skaičiuojami serveryje — klientas atsiųstoms
 * sumoms nepasitikime.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSlotAvailable } from "@/lib/booking/availability";
import { grandTotal, depositEur } from "@/lib/booking/pricing";
import { BOOKING, ADDONS, generateSlots } from "@/lib/booking/config";
import { validName, validPhone, validEmail, validFutureDate } from "@/lib/booking/validation";
import { createMontonioOrder } from "@/lib/montonio";

export const dynamic = "force-dynamic";

function siteUrl(req: Request): string {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  return new URL(req.url).origin;
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }

  const date = String(body.date || "");
  const time = String(body.time || "");
  const players = Number(body.players);
  const rawAddons = Array.isArray(body.addons) ? (body.addons as unknown[]).map(String) : [];
  const name = String(body.name || "");
  const phone = String(body.phone || "");
  const email = String(body.email || "");
  const note = body.note ? String(body.note).slice(0, 500) : null;

  // --- Validacija ---
  const errors: string[] = [];
  if (!validFutureDate(date)) errors.push("data");
  if (!generateSlots().includes(time)) errors.push("laikas");
  if (!Number.isInteger(players) || players < BOOKING.minPlayers || players > BOOKING.maxPlayers)
    errors.push("žaidėjai");
  if (!validName(name)) errors.push("vardas");
  if (!validPhone(phone)) errors.push("telefonas");
  if (!validEmail(email)) errors.push("el. paštas");

  const validAddonIds = ADDONS.map((a) => a.id);
  const addons = rawAddons.filter((id) => validAddonIds.includes(id));

  if (errors.length) {
    return NextResponse.json({ error: "Netinkami laukai: " + errors.join(", ") }, { status: 400 });
  }

  try {
    // --- Ar seansas dar laisvas? ---
    if (!(await isSlotAvailable(date, time))) {
      return NextResponse.json(
        { error: "Deja, šis laikas ką tik užimtas. Pasirinkite kitą." },
        { status: 409 },
      );
    }

    // --- Kainos (serveryje) ---
    const total = grandTotal(players, addons);
    const deposit = depositEur;
    const merchantReference = `BALA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const supabase = getSupabaseAdmin();

    // --- Įrašome pending rezervaciją ---
    const { data: inserted, error: insErr } = await supabase
      .from("bookings")
      .insert({
        date,
        time,
        players,
        addons,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        note,
        total_eur: total,
        deposit_eur: deposit,
        status: "pending",
        merchant_reference: merchantReference,
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    // --- Montonio mokėjimas (avansas) ---
    const base = siteUrl(req);
    const order = await createMontonioOrder({
      merchantReference,
      amount: deposit,
      returnUrl: `${base}/rezervacija/patvirtinta`,
      notificationUrl: `${base}/api/montonio/webhook`,
      description: `BALA VR pabėgimo kambario avansas — ${date} ${time}`,
    });

    // --- Išsaugome Montonio uuid ---
    await supabase.from("bookings").update({ montonio_uuid: order.uuid }).eq("id", inserted.id);

    return NextResponse.json({ paymentUrl: order.paymentUrl, merchantReference });
  } catch (e) {
    console.error("booking error:", e);
    return NextResponse.json(
      { error: "Nepavyko sukurti rezervacijos. Bandykite dar kartą." },
      { status: 500 },
    );
  }
}
