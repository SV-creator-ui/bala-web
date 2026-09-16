/**
 * PATCH /api/admin/bookings/[id]
 *   - Būsenos keitimas: { status }  (paid | cancelled | pending)
 *   - Perkėlimas:       { date, time }  (į kitą laisvą seansą)
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { updateBookingStatus, rescheduleBooking, getBooking, BookingConflictError, type BookingStatus } from "@/lib/admin/data";
import { getAvailability } from "@/lib/booking/availability";
import { generateSlotsForDate } from "@/lib/booking/config";
import { validFutureDate } from "@/lib/booking/validation";
import { resendBookingEmails } from "@/lib/booking/resend";
import { sendInvitationOnly } from "@/lib/email";
import { syncBookingCalendar } from "@/lib/booking/calendar-sync";
import { googleCalendarConfigured } from "@/lib/google-calendar";
import { getPayseraOrderStatus, isPaidStatus, payseraConfigured } from "@/lib/paysera";
import { markPaidByRef } from "@/lib/booking/settle";
import { BookingPaymentConflictError, isBookingOverlap } from "@/lib/booking/conflict";

export const dynamic = "force-dynamic";

const ALLOWED: BookingStatus[] = ["paid", "cancelled", "pending"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAuthed())) return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });

  const { id } = await params;
  let body: { status?: string; date?: string; time?: string; action?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Netinkami duomenys" }, { status: 400 });
  }

  // --- Pakartotinė kalendoriaus sinchronizacija ---
  // action="resync-calendar"       — PATCH esamą įvykį (arba POST jei nėra id)
  // action="force-recreate-calendar" — visada išmesti seną id ir kurti naują
  if (body.action === "resync-calendar" || body.action === "force-recreate-calendar") {
    if (!googleCalendarConfigured()) {
      return NextResponse.json({ error: "Google Calendar nesukonfigūruotas" }, { status: 400 });
    }
    try {
      await syncBookingCalendar(id, {
        throwOnError: true,
        forceRecreate: body.action === "force-recreate-calendar",
      });
      return NextResponse.json({ ok: true, recreated: body.action === "force-recreate-calendar" });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("admin resync calendar error:", message);
      return NextResponse.json({ error: `Kalendoriaus sinchronizacija nepavyko: ${message}` }, { status: 500 });
    }
  }

  // --- Persiųsti TIK gimtadienio kvietimo PDF (regeneruoja iš dabartinių duomenų) ---
  if (body.action === "resend-invitation") {
    const override = validEmail(body.email);
    if (body.email && !override) {
      return NextResponse.json({ error: "Netinkamas el. pašto adresas" }, { status: 400 });
    }
    const booking = await getBooking(id);
    if (!booking) return NextResponse.json({ error: "Rezervacija nerasta" }, { status: 404 });
    const result = await sendInvitationOnly(booking, override);
    if (!result.ok) {
      return NextResponse.json({ error: result.error || "Nepavyko išsiųsti" }, { status: 400 });
    }
    return NextResponse.json({ ok: true, count: result.count });
  }

  // --- Sinchronizacija su Paysera (fallback, kai callback nesuveikė) ---
  // Skirta pending arba expired rezervacijoms: paklausiam Paysera pagal
  // saugotą order id (montonio_uuid) — jei pilnai apmokėta, iškviečiam
  // `markPaidByRef` (statusas → paid, kalendorius, laiškai, kvietimas).
  if (body.action === "check-paysera") {
    if (!payseraConfigured()) {
      return NextResponse.json({ error: "Paysera nesukonfigūruota" }, { status: 400 });
    }
    const booking = await getBooking(id);
    if (!booking) return NextResponse.json({ error: "Rezervacija nerasta" }, { status: 404 });
    if (booking.status === "paid") {
      return NextResponse.json({ ok: true, status: "paid", note: "Jau apmokėta" });
    }
    if (!booking.montonio_uuid) {
      return NextResponse.json({ error: "Nėra Paysera order id (montonio_uuid tuščias)" }, { status: 400 });
    }
    const st = await getPayseraOrderStatus(booking.montonio_uuid);
    if (!isPaidStatus(st)) {
      return NextResponse.json({ ok: true, status: st ?? "unknown", note: "Paysera dar neapmokėta" });
    }
    try {
      await markPaidByRef(booking.merchant_reference);
      const fresh = await getBooking(id);
      return NextResponse.json({ ok: true, status: fresh?.status ?? "paid", settled: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error("admin check-paysera settle error:", message);
      return NextResponse.json({ error: `Sinchronizacija nepavyko: ${message}` }, { status: e instanceof BookingPaymentConflictError ? 409 : 500 });
    }
  }

  // --- Pakartotinis laiško siuntimas (pvz. į teisingą adresą) ---
  if (body.action === "resend") {
    const override = validEmail(body.email);
    if (body.email && !override) {
      return NextResponse.json({ error: "Netinkamas el. pašto adresas" }, { status: 400 });
    }
    const ok = await resendBookingEmails(id, override);
    if (!ok) {
      return NextResponse.json(
        { error: "Nepavyko išsiųsti (rezervacija ne apmokėta arba el. paštas nesukonfigūruotas)" },
        { status: 400 },
      );
    }
    return NextResponse.json({ ok: true });
  }

  // --- Perkėlimas į kitą laiką ---
  if (body.date || body.time) {
    const date = String(body.date || "");
    const time = String(body.time || "");
    if (!validFutureDate(date) || !generateSlotsForDate(date).includes(time)) {
      return NextResponse.json({ error: "Netinkama data arba laikas" }, { status: 400 });
    }
    try {
      const existing = await getBooking(id);
      if (!existing) {
        return NextResponse.json({ error: "Rezervacija nerasta" }, { status: 404 });
      }
      const type = existing.type === "party" ? "party" : "room";
      const addons = Array.isArray(existing.addons) ? existing.addons : [];
      const slots = await getAvailability(date, {
        type,
        packageId: existing.package_id,
        addons,
        excludeId: id,
      });
      const ok = slots.some((s) => s.time === time && s.available);
      if (!ok) {
        return NextResponse.json({ error: "Šis laikas jau užimtas. Pasirinkite kitą." }, { status: 409 });
      }
      await rescheduleBooking(id, date, time);
      return NextResponse.json({ ok: true });
    } catch (e) {
      if (isBookingOverlap(e)) return NextResponse.json({ error: "Šis laikas jau užimtas." }, { status: 409 });
      console.error("admin reschedule error:", e);
      return NextResponse.json({ error: "Nepavyko perkelti" }, { status: 500 });
    }
  }

  // --- Būsenos keitimas ---
  const status = body.status as BookingStatus;
  if (!ALLOWED.includes(status)) {
    return NextResponse.json({ error: "Netinkama būsena" }, { status: 400 });
  }
  try {
    await updateBookingStatus(id, status);
    return NextResponse.json({ ok: true });
  } catch (e) {
    if (isBookingOverlap(e)) return NextResponse.json({ error: "Šis laikas jau užimtas kitos galiojančios rezervacijos." }, { status: 409 });
    if (e instanceof BookingConflictError) {
      const c = e.conflicting;
      return NextResponse.json(
        {
          error: `Šis laikas (${c.date} ${c.time}) jau turi apmokėtą rezervaciją: ${c.customer_name} (${c.merchant_reference}). Patikrinkite, ar tai ne tas pats klientas — jei taip, atšaukite šitą pending rezervaciją.`,
          conflictingId: c.id,
        },
        { status: 409 },
      );
    }
    console.error("admin update booking error:", e);
    return NextResponse.json({ error: "Nepavyko atnaujinti" }, { status: 500 });
  }
}

/** Grąžina apkarpytą el. paštą, jei tinkamas; kitaip undefined (arba jei nebuvo). */
function validEmail(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  const e = raw.trim();
  if (!e) return undefined;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : undefined;
}
