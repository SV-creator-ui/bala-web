/**
 * Atribucijos įrašymas į DB (tik serveris). Best-effort: jei `attribution`
 * stulpelio dar nėra (migration_012 nepaleista) — tik log'inam, užsakymas vyksta.
 */
import { getSupabaseAdmin } from "@/lib/supabase/server";
import type { Attribution } from "@/lib/attribution";

export async function saveAttribution(
  table: "bookings" | "vouchers",
  id: string,
  attribution: Attribution | null,
): Promise<void> {
  if (!attribution) return;
  try {
    const { error } = await getSupabaseAdmin().from(table).update({ attribution }).eq("id", id);
    if (error) console.error(`attribution save failed (${table}):`, error.message);
  } catch (e) {
    console.error(`attribution save error (${table}):`, e);
  }
}
