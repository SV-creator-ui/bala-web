/**
 * Laisvų seansų skaičiavimas (serveryje).
 * Seansas užimtas, jei jam yra apmokėta ("paid") rezervacija arba dar
 * galiojantis "pending" holdas, arba jis užblokuotas (blackouts).
 */
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { BOOKING, generateSlots } from "./config";

export type SlotStatus = { time: string; available: boolean };

export async function getAvailability(date: string): Promise<SlotStatus[]> {
  const supabase = getSupabaseAdmin();
  const slots = generateSlots();

  const holdCutoff = new Date(Date.now() - BOOKING.pendingHoldMin * 60_000).toISOString();

  const [{ data: bookings }, { data: blackouts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("time,status,created_at")
      .eq("date", date)
      .in("status", ["paid", "pending"]),
    supabase.from("blackouts").select("time").eq("date", date),
  ]);

  const wholeDayBlocked = (blackouts || []).some((b) => b.time === null);
  const blockedTimes = new Set(
    (blackouts || []).filter((b) => b.time).map((b) => b.time as string),
  );

  // Suskaičiuojame, kiek grupių užima kiekvieną laiką
  const counts = new Map<string, number>();
  for (const b of bookings || []) {
    // Nustojęs galioti pending holdas — nebeskaičiuojamas
    if (b.status === "pending" && b.created_at < holdCutoff) continue;
    counts.set(b.time, (counts.get(b.time) || 0) + 1);
  }

  return slots.map((time) => {
    if (wholeDayBlocked || blockedTimes.has(time)) return { time, available: false };
    const taken = counts.get(time) || 0;
    return { time, available: taken < BOOKING.slotCapacity };
  });
}

/** Ar konkretus seansas laisvas (naudojama prieš kuriant rezervaciją) */
export async function isSlotAvailable(date: string, time: string): Promise<boolean> {
  const all = await getAvailability(date);
  return all.some((s) => s.time === time && s.available);
}
