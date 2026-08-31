-- Migracija 003: Google Calendar įvykio id saugojimas.
-- Paleiskite EGZISTUOJANČIOJE DB (Supabase SQL Editor -> New query -> Run).

alter table public.bookings add column if not exists gcal_event_id text;
