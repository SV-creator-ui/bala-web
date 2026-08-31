-- BALA VR rezervacijų DB schema (Supabase / Postgres)
-- Paleiskite šitą Supabase projekte: SQL Editor -> New query -> įklijuokite -> Run.

-- ============ REZERVACIJOS ============
create table if not exists public.bookings (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  type               text not null default 'room'       -- 'room' | 'party'
                       check (type in ('room','party')),
  package_id         text,                              -- paketo id ('maksi'...) kai type='party'
  date               date not null,
  time               text not null,                     -- klientui rodoma pradžia "14:30"
  block_start        text,                              -- realiai užimto lango pradžia "13:30"
  block_end          text,                              -- realiai užimto lango pabaiga "16:30"
  players            int  not null check (players between 1 and 30),
  addons             jsonb not null default '[]'::jsonb,
  customer_name      text not null,
  customer_phone     text not null,
  customer_email     text not null,
  note               text,
  total_eur          numeric(8,2) not null,             -- pilna suma
  deposit_eur        numeric(8,2) not null,             -- sumokamas avansas
  status             text not null default 'pending'
                       check (status in ('pending','paid','cancelled','expired')),
  montonio_uuid      text,
  merchant_reference text not null unique,
  gcal_event_id      text,                              -- Google Calendar įvykio id
  emails_sent_at     timestamptz                        -- kada išsiųsti patvirtinimo laiškai
);

create index if not exists bookings_date_time_idx on public.bookings (date, time);
create index if not exists bookings_status_idx on public.bookings (status);

-- ============ UŽBLOKUOTI LAIKAI (remontas, privatūs renginiai) ============
-- time = null reiškia, kad užblokuota visa diena.
create table if not exists public.blackouts (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  date       date not null,
  time       text,
  reason     text
);

create index if not exists blackouts_date_idx on public.blackouts (date);

-- ============ SAUGUMAS (RLS) ============
-- Įjungiame Row Level Security. Prie lentelių jungiamės TIK per serverio
-- service-role raktą (jis apeina RLS), tad jokių viešų politikų nekuriame —
-- naršyklė tiesiogiai prie duomenų neprieina.
alter table public.bookings  enable row level security;
alter table public.blackouts enable row level security;
