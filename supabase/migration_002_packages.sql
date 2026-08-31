-- Migracija 002: gimtadienių / šventinių paketų palaikymas bendrame grafike.
-- Paleiskite EGZISTUOJANČIOJE DB (Supabase SQL Editor -> New query -> Run),
-- jei `bookings` lentelė jau sukurta pagal seną schema.sql.
-- (Naujoms DB pakanka atnaujinto schema.sql — šios migracijos nereikia.)

-- Nauji stulpeliai (idempotentiška).
alter table public.bookings add column if not exists type        text not null default 'room';
alter table public.bookings add column if not exists package_id  text;
alter table public.bookings add column if not exists block_start text;
alter table public.bookings add column if not exists block_end   text;

-- Tipo apribojimas.
alter table public.bookings drop constraint if exists bookings_type_check;
alter table public.bookings add  constraint bookings_type_check check (type in ('room','party'));

-- Paketai talpina daugiau žaidėjų (iki 16) — praplečiame ribą.
alter table public.bookings drop constraint if exists bookings_players_check;
alter table public.bookings add  constraint bookings_players_check check (players between 1 and 30);

-- Seniems įrašams (be block_*) užpildome langą: kambariui +60 min.
-- (Paketų senuose įrašuose nėra, todėl visus laikome 'room'.)
update public.bookings
set block_start = time,
    block_end   = to_char((time::time + interval '60 minutes'), 'HH24:MI')
where block_start is null;
