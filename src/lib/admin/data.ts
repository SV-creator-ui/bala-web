/**
 * Admin duomenų sluoksnis. Jei Supabase sukonfigūruota — dirba su DB.
 * Jei ne — DEMO režimas su pavyzdiniais duomenimis atmintyje (kad skydelį
 * būtų galima iškart pamatyti ir išbandyti be DB).
 */
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { dbConfigured } from "./auth";

export type Blackout = { id: string; date: string; time: string | null; reason: string | null };
export type BookingStatus = BookingRow["status"];

export type BookingsFilter = {
  from?: string; // YYYY-MM-DD
  to?: string;
  status?: BookingStatus | "all";
};

/* ============ DEMO DUOMENYS (atmintyje) ============ */
function iso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

let demoBookings: BookingRow[] = [
  mkBooking("Jonas Petraitis", "+370 612 34567", "jonas@pastas.lt", iso(0), "16:30", 4, "paid", 80, 30),
  mkBooking("Rūta Kazlauskė", "+370 655 11223", "ruta@gmail.com", iso(0), "18:00", 2, "paid", 50, 30, "Gimtadienis"),
  mkBooking("Tomas Butkus", "+370 600 99887", "tomas@pastas.lt", iso(1), "13:30", 6, "pending", 120, 30),
  mkBooking("Greta Norvilaitė", "+370 611 22334", "greta@pastas.lt", iso(2), "19:30", 3, "paid", 65, 30, "Bernvakaris"),
  mkBooking("Mindaugas Šarka", "+370 622 55667", "m.sarka@pastas.lt", iso(3), "15:00", 8, "paid", 160, 30, "Įmonės renginys"),
  mkBooking("Aistė Jankauskaitė", "+370 633 44556", "aiste@pastas.lt", iso(-2), "12:00", 2, "cancelled", 50, 30),
];
let demoBlackouts: Blackout[] = [
  { id: "bo-1", date: iso(4), time: null, reason: "Privatus renginys" },
];

function mkBooking(
  name: string, phone: string, email: string, date: string, time: string,
  players: number, status: BookingStatus, total: number, deposit: number, note: string | null = null,
): BookingRow {
  return {
    id: "demo-" + Math.random().toString(36).slice(2, 9),
    created_at: new Date().toISOString(),
    date, time, players, addons: [],
    customer_name: name, customer_phone: phone, customer_email: email, note,
    total_eur: total, deposit_eur: deposit, status,
    montonio_uuid: null, merchant_reference: "BALA-DEMO-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
  };
}

/* ============ VIEŠOS FUNKCIJOS ============ */

export async function listBookings(filter: BookingsFilter = {}): Promise<BookingRow[]> {
  if (!dbConfigured()) {
    return demoBookings
      .filter((b) => (filter.from ? b.date >= filter.from : true))
      .filter((b) => (filter.to ? b.date <= filter.to : true))
      .filter((b) => (filter.status && filter.status !== "all" ? b.status === filter.status : true))
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  }
  const supabase = getSupabaseAdmin();
  let q = supabase.from("bookings").select("*");
  if (filter.from) q = q.gte("date", filter.from);
  if (filter.to) q = q.lte("date", filter.to);
  if (filter.status && filter.status !== "all") q = q.eq("status", filter.status);
  const { data, error } = await q.order("date").order("time");
  if (error) throw error;
  return (data ?? []) as BookingRow[];
}

export async function updateBookingStatus(id: string, status: BookingStatus): Promise<void> {
  if (!dbConfigured()) {
    demoBookings = demoBookings.map((b) => (b.id === id ? { ...b, status } : b));
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function listBlackouts(): Promise<Blackout[]> {
  if (!dbConfigured()) {
    return [...demoBlackouts].sort((a, b) => a.date.localeCompare(b.date));
  }
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from("blackouts").select("*").order("date");
  if (error) throw error;
  return (data ?? []) as Blackout[];
}

export async function addBlackout(date: string, time: string | null, reason: string | null): Promise<void> {
  if (!dbConfigured()) {
    demoBlackouts.push({ id: "bo-" + Math.random().toString(36).slice(2, 8), date, time, reason });
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("blackouts").insert({ date, time, reason });
  if (error) throw error;
}

export async function removeBlackout(id: string): Promise<void> {
  if (!dbConfigured()) {
    demoBlackouts = demoBlackouts.filter((b) => b.id !== id);
    return;
  }
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("blackouts").delete().eq("id", id);
  if (error) throw error;
}
