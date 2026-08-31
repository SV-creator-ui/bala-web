-- Migracija 004: patvirtinimo laiškų žymė (kad laiškai būtų siunčiami vieną kartą).
-- Paleiskite EGZISTUOJANČIOJE DB (Supabase SQL Editor -> New query -> Run).

alter table public.bookings add column if not exists emails_sent_at timestamptz;
