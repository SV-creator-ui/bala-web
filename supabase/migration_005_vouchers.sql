-- BALA VR — DOVANŲ KUPONAI (migracija 005)
-- Paleiskite Supabase projekte: SQL Editor -> New query -> įklijuokite -> Run.
-- Priklauso nuo schema.sql (bookings lentelės).

-- ============ DOVANŲ KUPONAI ============
create table if not exists public.vouchers (
  id                   uuid primary key default gen_random_uuid(),
  created_at           timestamptz not null default now(),

  -- Unikalus kupono kodas (pvz. "BALA-A7K4-9QMX"). Sugeneruojamas APMOKĖJUS
  -- (iki tol NULL). Klientas jį naudoja rezervuodamas.
  code                 text unique,

  amount_eur           numeric(8,2) not null,             -- kupono vertė (nominalas)

  status               text not null default 'pending'
                         check (status in ('pending','active','redeemed','cancelled','expired')),

  -- Pirkėjas (į jo el. paštą siunčiamas PDF)
  buyer_name           text not null,
  buyer_email          text not null,

  -- Neprivaloma personalizacija — atspausdinama ANT PDF kupono (laiškas visada
  -- keliauja pirkėjui; jis pats padovanoja).
  recipient_name       text,                              -- „Kam"
  from_name            text,                              -- „Nuo"
  message              text,                              -- palinkėjimas

  valid_until          date,                              -- galiojimas (issue + 6 mėn.), NULL kol neapmokėta

  montonio_uuid        text,
  merchant_reference   text not null unique,              -- "GIFT-..." (atskiria nuo rezervacijų)

  issued_at            timestamptz,                       -- kada apmokėta + sugeneruotas kodas
  redeemed_at          timestamptz,                       -- kada panaudotas
  redeemed_booking_ref text,                              -- kurios rezervacijos metu panaudotas
  emails_sent_at       timestamptz                        -- kada išsiųstas PDF pirkėjui (idempotencijai)
);

create index if not exists vouchers_status_idx on public.vouchers (status);
create index if not exists vouchers_code_idx   on public.vouchers (code);

alter table public.vouchers enable row level security;
-- Prie lentelės jungiamės TIK per serverio service-role raktą (jis apeina RLS),
-- todėl viešų politikų nekuriame — naršyklė tiesiogiai prie duomenų neprieina.

-- ============ REZERVACIJŲ PAPILDYMAS: panaudotas kuponas ============
alter table public.bookings
  add column if not exists voucher_code         text,
  add column if not exists voucher_discount_eur numeric(8,2) not null default 0;
