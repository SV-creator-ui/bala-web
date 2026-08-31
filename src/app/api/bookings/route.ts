/**
 * POST /api/bookings
 * Sukuria "pending" rezervaciją (įprastą kambarį ARBA gimtadienio/šventės
 * paketą), inicijuoja Montonio avanso mokėjimą ir grąžina apmokėjimo nuorodą.
 *
 * SVARBU: kaina, avansas IR užimtas laiko langas skaičiuojami serveryje —
 * klientui atsiųstoms reikšmėms nepasitikime.
 */
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { isSlotAvailable } from "@/lib/booking/availability";
import { grandTotal } from "@/lib/booking/pricing";
import { BOOKING, ADDONS, generateSlotsForDate, dayHours, depositFor, type BookingType } from "@/lib/booking/config";
import { bookingWindowHHMM } from "@/lib/booking/window";
import {
  getPartyPackage,
  partyTotal,
  PARTY_EXTRAS,
} from "@/lib/booking/packages";
import {
  validName,
  validPhone,
  validEmail,
  validFutureDate,
  validBookingType,
} from "@/lib/booking/validation";
import { createMontonioOrder, montonioConfigured, bookingTestMode } from "@/lib/montonio";

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

  const type: BookingType = validBookingType(String(body.type)) ? (String(body.type) as BookingType) : "room";
  const date = String(body.date || "");
  const time = String(body.time || "");
  const players = Number(body.players);
  const rawAddons = Array.isArray(body.addons) ? (body.addons as unknown[]).map(String) : [];
  const packageId = body.packageId ? String(body.packageId) : null;
  const name = String(body.name || "");
  const phone = String(body.phone || "");
  const email = String(body.email || "");
  const note = body.note ? String(body.note).slice(0, 500) : null;

  // --- Bendra validacija ---
  const errors: string[] = [];
  if (!validFutureDate(date)) errors.push("data");
  else if (!generateSlotsForDate(date).includes(time)) errors.push("laikas");
  if (!validName(name)) errors.push("vardas");
  if (!validPhone(phone)) errors.push("telefonas");
  if (!validEmail(email)) errors.push("el. paštas");

  // --- Tipui specifinė validacija + kainos/priedų sanitizavimas ---
  let total: number;
  let addons: string[];

  if (type === "party") {
    const pkg = getPartyPackage(packageId || "");
    if (!pkg) errors.push("paketas");
    const validExtraIds = PARTY_EXTRAS.map((e) => e.id);
    addons = rawAddons.filter((id) => validExtraIds.includes(id));
    if (pkg && (!Number.isInteger(players) || players < 1 || players > pkg.maxPlayers)) {
      errors.push("žaidėjai");
    }
    if (errors.length) {
      return NextResponse.json({ error: "Netinkami laukai: " + errors.join(", ") }, { status: 400 });
    }
    total = partyTotal(pkg!, date, addons);
  } else {
    const validAddonIds = ADDONS.map((a) => a.id);
    addons = rawAddons.filter((id) => validAddonIds.includes(id));
    if (!Number.isInteger(players) || players < BOOKING.minPlayers || players > BOOKING.maxPlayers) {
      errors.push("žaidėjai");
    }
    if (errors.length) {
      return NextResponse.json({ error: "Netinkami laukai: " + errors.join(", ") }, { status: 400 });
    }
    total = grandTotal(players, addons);
  }

  const deposit = depositFor(type);

  // --- Ar galime priimti rezervaciją? ---
  const montonioReady = montonioConfigured();
  const testMode = bookingTestMode();
  if (!montonioReady && !testMode) {
    return NextResponse.json(
      { error: "Mokėjimai laikinai nesukonfigūruoti. Susisiekite su mumis telefonu." },
      { status: 503 },
    );
  }

  try {
    // --- Ar laikas dar laisvas šiam langui? (bendras grafikas) ---
    if (!(await isSlotAvailable(date, time, { type, packageId, addons }))) {
      return NextResponse.json(
        { error: "Deja, šis laikas ką tik užimtas. Pasirinkite kitą." },
        { status: 409 },
      );
    }

    const { blockStart, blockEnd } = bookingWindowHHMM(type, time, packageId, addons, dayHours(date).openMin);
    const merchantReference = `BALA-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const supabase = getSupabaseAdmin();

    const { data: inserted, error: insErr } = await supabase
      .from("bookings")
      .insert({
        type,
        package_id: type === "party" ? packageId : null,
        date,
        time,
        block_start: blockStart,
        block_end: blockEnd,
        players,
        addons,
        customer_name: name.trim(),
        customer_phone: phone.trim(),
        customer_email: email.trim(),
        note: testMode ? `[TEST] ${note ?? ""}`.trim() : note,
        total_eur: total,
        deposit_eur: deposit,
        status: montonioReady ? "pending" : "paid",
        merchant_reference: merchantReference,
      })
      .select("id")
      .single();

    if (insErr) throw insErr;

    // Gimtadienių paketai turi savo dizaino patvirtinimo puslapį.
    const confirmPath = type === "party"
      ? "/gimtadieniai/rezervacija/patvirtinta"
      : "/rezervacija/patvirtinta";

    // --- Testavimo režimas: praleidžiam mokėjimą ---
    if (!montonioReady) {
      return NextResponse.json({
        paymentUrl: `${confirmPath}?ref=${encodeURIComponent(merchantReference)}&test=1`,
        merchantReference,
        test: true,
      });
    }

    // --- Montonio mokėjimas (avansas) ---
    const base = siteUrl(req);
    const label = type === "party"
      ? `BALA VR gimtadienio paketo avansas — ${date} ${time}`
      : `BALA VR pabėgimo kambario avansas — ${date} ${time}`;
    const order = await createMontonioOrder({
      merchantReference,
      amount: deposit,
      returnUrl: `${base}${confirmPath}`,
      notificationUrl: `${base}/api/montonio/webhook`,
      description: label,
    });

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
