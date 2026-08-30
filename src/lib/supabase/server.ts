/**
 * Supabase klientas SERVERIO pusei (service role — pilnos teisės).
 * NIEKADA neimportuokite šito į kliento komponentus — service role raktas
 * yra slaptas. Naudojamas tik API route'uose.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Trūksta Supabase aplinkos kintamųjų (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Žr. REZERVACIJA_SETUP.md",
    );
  }
  cached = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

/** Rezervacijos įrašo tipas (atitinka lentelę `bookings`) */
export type BookingRow = {
  id: string;
  created_at: string;
  date: string; // YYYY-MM-DD
  time: string; // "14:30"
  players: number;
  addons: string[];
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  note: string | null;
  total_eur: number;
  deposit_eur: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  montonio_uuid: string | null;
  merchant_reference: string;
};
