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
  type: "room" | "party" | "game";
  package_id: string | null;
  date: string; // YYYY-MM-DD
  time: string; // "14:30" — klientui rodoma pradžia
  block_start: string | null; // "13:30" — realiai užimto lango pradžia
  block_end: string | null; // "16:30" — realiai užimto lango pabaiga
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
  gcal_event_id: string | null; // Google Calendar įvykio id (jei sukurtas)
  emails_sent_at: string | null; // kada išsiųsti patvirtinimo laiškai (null = dar ne)
  voucher_code: string | null; // panaudoto dovanų kupono kodas (jei buvo)
  voucher_discount_eur: number; // kiek kuponas padengė šioje rezervacijoje (EUR)
};

/** Dovanų kupono įrašo tipas (atitinka lentelę `vouchers`) */
export type VoucherRow = {
  id: string;
  created_at: string;
  code: string | null; // NULL kol neapmokėta
  amount_eur: number;
  status: "pending" | "active" | "redeemed" | "cancelled" | "expired";
  buyer_name: string;
  buyer_email: string;
  recipient_name: string | null;
  from_name: string | null;
  message: string | null;
  valid_until: string | null; // YYYY-MM-DD
  montonio_uuid: string | null;
  merchant_reference: string; // "GIFT-..."
  issued_at: string | null;
  redeemed_at: string | null;
  redeemed_booking_ref: string | null;
  emails_sent_at: string | null;
};
