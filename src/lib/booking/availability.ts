/**
 * Laisvų PRADŽIOS laikų skaičiavimas (serveryje) — bendras grafikas.
 * Kiekviena esama rezervacija (paid arba galiojantis pending) užima intervalą.
 * Naujas pradžios laikas tinka, jei visas jo langas telpa į darbo laiką ir
 * nepersidengia su užimtais intervalais (talpa BOOKING.slotCapacity) bei
 * neužkliudo užblokuotų (blackouts) laikų.
 */
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { BOOKING, generateSlots, dayStartMin, dayEndMin, toMin, type BookingType } from "./config";
import { bookingWindow, overlaps, type Interval } from "./window";

export type SlotStatus = { time: string; available: boolean };

export type AvailabilityQuery = {
  type: BookingType;
  packageId?: string | null;
  addons?: string[];
  /** Rezervacijos id, kurios NEskaičiuoti kaip užimtos (perkeliant ją pačią). */
  excludeId?: string | null;
};

/** Kokį langą DB įraše užima esama rezervacija. */
function existingInterval(b: {
  time: string;
  type?: string | null;
  package_id?: string | null;
  block_start?: string | null;
  block_end?: string | null;
  addons?: unknown;
}): Interval {
  // Naujuose įrašuose saugomas tikslus langas — naudojame jį.
  if (b.block_start && b.block_end) {
    return { startMin: toMin(b.block_start), endMin: toMin(b.block_end) };
  }
  // Atgalinis suderinamumas su senais įrašais (be block_* stulpelių).
  const addons = Array.isArray(b.addons) ? (b.addons as unknown[]).map(String) : [];
  const type: BookingType = b.type === "party" ? "party" : "room";
  return bookingWindow(type, b.time, b.package_id ?? null, addons);
}

export async function getAvailability(date: string, query: AvailabilityQuery): Promise<SlotStatus[]> {
  const supabase = getSupabaseAdmin();
  const slots = generateSlots();

  const holdCutoff = new Date(Date.now() - BOOKING.pendingHoldMin * 60_000).toISOString();

  const [{ data: bookings }, { data: blackouts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,time,status,created_at,type,package_id,block_start,block_end,addons")
      .eq("date", date)
      .in("status", ["paid", "pending"]),
    supabase.from("blackouts").select("time").eq("date", date),
  ]);

  const wholeDayBlocked = (blackouts || []).some((b) => b.time === null);
  // Kiekvienas užblokuotas laikas — 30 min. langas [t, t+step).
  const blackoutIntervals: Interval[] = (blackouts || [])
    .filter((b) => b.time)
    .map((b) => {
      const s = toMin(b.time as string);
      return { startMin: s, endMin: s + BOOKING.slotStepMin };
    });

  // Galiojantys užimti intervalai.
  const busy: Interval[] = [];
  for (const b of bookings || []) {
    if (query.excludeId && b.id === query.excludeId) continue; // ji pati (perkeliama)
    if (b.status === "pending" && b.created_at < holdCutoff) continue; // nustojęs galioti holdas
    busy.push(existingInterval(b));
  }

  return slots.map((time) => {
    if (wholeDayBlocked) return { time, available: false };

    const w = bookingWindow(query.type, time, query.packageId ?? null, query.addons ?? []);

    // 1) Ar langas telpa į darbo laiką?
    if (w.startMin < dayStartMin || w.endMin > dayEndMin) return { time, available: false };

    // 2) Ar neužkliudo užblokuotų laikų?
    if (blackoutIntervals.some((bo) => overlaps(w, bo))) return { time, available: false };

    // 3) Ar telpa į talpą (persidengimų skaičius < slotCapacity)?
    const clashes = busy.reduce((n, iv) => (overlaps(w, iv) ? n + 1 : n), 0);
    return { time, available: clashes < BOOKING.slotCapacity };
  });
}

/** Ar konkretus pradžios laikas laisvas (naudojama prieš kuriant rezervaciją). */
export async function isSlotAvailable(date: string, time: string, query: AvailabilityQuery): Promise<boolean> {
  const all = await getAvailability(date, query);
  return all.some((s) => s.time === time && s.available);
}
