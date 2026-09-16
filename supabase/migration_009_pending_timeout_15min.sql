-- P1 follow-up: shorten pending booking hold from 30 to 15 minutes.
-- Requires migration_007_booking_exclusion.sql already installed.
-- Safe for production: only changes three functions and expires stale holds.
-- Paid, cancelled and expired bookings are left untouched.
-- No schema, index, constraint or trigger definitions are altered.
--
-- Impact on currently active pending rows:
--   • age < 15 min  → keep holding the slot, but new expiry is created_at+15
--   • age 15–30 min → previously „still held", now expired immediately by the
--                     one-shot cleanup at the end of this file. Slot becomes
--                     free for other customers on the very next claim.
--   • age > 30 min  → already expired under the old rule; no change.
-- If Paysera is currently disabled in production (no PAYSERA_* env vars),
-- there are typically no live pending holds, so the immediate cleanup is a
-- no-op. Run the migration first, application redeploy second.

begin;
lock table public.bookings in access exclusive mode;

-- expire_pending_bookings — kviečiama iš admin skydelio ir booking triggerio;
-- pakeičiamas tik intervalo dydis, viskas kita identiška migration_007 versijai.
create or replace function public.expire_pending_bookings() returns void
language sql volatile set search_path = pg_catalog as $$
  update public.bookings set status = 'expired'
  where status = 'pending' and created_at + interval '15 minutes' <= statement_timestamp();
$$;

-- booking_release_expired — before-write trigger'is; užtikrina, kad
-- šviežiai matomas pending, kurio hold pasibaigė, būtų expired prieš
-- įrašant naują claim'ą. Tik intervalas keičiamas.
create or replace function public.booking_release_expired() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if TG_OP = 'UPDATE' and NEW.created_at is distinct from OLD.created_at then
    raise exception 'Booking hold start is immutable' using errcode = '23514';
  end if;
  if NEW.status = 'pending' and NEW.created_at + interval '15 minutes' <= statement_timestamp() then
    NEW.status := 'expired';
  end if;
  if NEW.status in ('pending','paid') then
    -- This cleanup is part of the same statement/transaction as the new claim.
    -- Exclusion constraints, not this check, arbitrate simultaneous claims.
    update public.bookings set status = 'expired'
    where date between NEW.date - 1 and NEW.date + 1
      and id <> NEW.id and status = 'pending'
      and created_at + interval '15 minutes' <= statement_timestamp();
  end if;
  return NEW;
end $$;

-- active_bookings_for_date — skaitomas iš availability.ts; tik intervalas.
create or replace function public.active_bookings_for_date(p_date date)
returns setof public.bookings language sql stable set search_path = pg_catalog as $$
  select * from public.bookings where date = p_date and
    (status = 'paid' or (status = 'pending' and created_at + interval '15 minutes' > statement_timestamp()));
$$;

-- Vienkartinis švarumas: pending eilutes, senesnes už naują 15-min ribą,
-- iškart pažymim expired, kad nekiltų netikėtų blokavimų po redeploy'aus.
-- Šis update'as vykdomas su ta pačia access exclusive lock'a — jokios naujos
-- rezervacijos nepradedamos, kol jis vyksta.
update public.bookings set status = 'expired'
where status = 'pending' and created_at + interval '15 minutes' <= statement_timestamp();

notify pgrst, 'reload schema';
commit;
