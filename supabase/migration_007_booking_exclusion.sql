-- P1: atomic interval protection. Apply manually, BEFORE deploying the matching app.
-- Requires schema.sql + migrations 002..006. Transaction rolls back on existing
-- active overlaps/unknown packages; never delete or silently cancel paid bookings.
begin;
lock table public.bookings in access exclusive mode;

-- migration_002/schema.sql allowed only room/party. Game bookings use the
-- same 60-minute guard as rooms and must pass the table-level type check.
alter table public.bookings drop constraint if exists bookings_type_check;
alter table public.bookings add constraint bookings_type_check
  check (type in ('room', 'party', 'game'));

-- Mirrors window.ts/packages.ts: room/game 60; maksi/vip/gold 120/150/180;
-- extratime +15; before party 30, after party 15. No pricing changes.
create function public.booking_guard_range(
  p_date date, p_time text, p_type text, p_package text, p_addons jsonb,
  p_status text, p_before boolean
) returns tsrange language plpgsql immutable set search_path = pg_catalog as $$
declare
  starts timestamp;
  duration_min integer;
begin
  if p_status not in ('pending', 'paid') then return null; end if;
  if p_time is null or p_time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
    raise exception 'Invalid booking time' using errcode = '23514';
  end if;
  starts := p_date + p_time::time;
  if p_type = 'party' then
    duration_min := case p_package when 'maksi' then 120 when 'vip' then 150 when 'gold' then 180 end;
    if duration_min is null then
      raise exception 'Unknown party package: %', p_package using errcode = '23514';
    end if;
    if p_addons ? 'extratime' then duration_min := duration_min + 15; end if;
  elsif p_type in ('room', 'game') then duration_min := 60;
  else raise exception 'Unknown booking type' using errcode = '23514';
  end if;
  return tsrange(
    starts - make_interval(mins => case when p_before and p_type = 'party' then 30 else 0 end),
    starts + make_interval(mins => duration_min + case when not p_before and p_type = 'party' then 15 else 0 end),
    '[)'
  );
end $$;

alter table public.bookings add column payment_conflict_at timestamptz;
-- Old pending rows no longer hold inventory, regardless of whether admin opened it.
update public.bookings set status = 'expired'
where status = 'pending' and created_at + interval '30 minutes' <= statement_timestamp();

alter table public.bookings
  add column guard_before tsrange generated always as
    (public.booking_guard_range(date,time,type,package_id,addons,status,true)) stored,
  add column guard_after tsrange generated always as
    (public.booking_guard_range(date,time,type,package_id,addons,status,false)) stored;

-- TWO constraints implement max(before-next, after-previous), NOT their sum.
-- Native GiST exclusion checks concurrent uncommitted writes as well as committed
-- rows. Covers INSERT, manual admin UPDATE, rescheduling and payment settlement.
-- Range types have native GiST support: no extension is required.
alter table public.bookings
  add constraint bookings_no_overlap_before exclude using gist (guard_before with &&),
  add constraint bookings_no_overlap_after exclude using gist (guard_after with &&);

create function public.expire_pending_bookings() returns void
language sql volatile set search_path = pg_catalog as $$
  update public.bookings set status = 'expired'
  where status = 'pending' and created_at + interval '30 minutes' <= statement_timestamp();
$$;

create function public.booking_release_expired() returns trigger
language plpgsql set search_path = pg_catalog as $$
begin
  if TG_OP = 'UPDATE' and NEW.created_at is distinct from OLD.created_at then
    raise exception 'Booking hold start is immutable' using errcode = '23514';
  end if;
  if NEW.status = 'pending' and NEW.created_at + interval '30 minutes' <= statement_timestamp() then
    NEW.status := 'expired';
  end if;
  if NEW.status in ('pending','paid') then
    -- This cleanup is part of the same statement/transaction as the new claim.
    -- Exclusion constraints, not this check, arbitrate simultaneous claims.
    update public.bookings set status = 'expired'
    where date between NEW.date - 1 and NEW.date + 1
      and id <> NEW.id and status = 'pending'
      and created_at + interval '30 minutes' <= statement_timestamp();
  end if;
  return NEW;
end $$;
create trigger booking_release_expired_before_write
before insert or update of status,date,time,type,package_id,addons,created_at
on public.bookings for each row execute function public.booking_release_expired();

create function public.active_bookings_for_date(p_date date)
returns setof public.bookings language sql stable set search_path = pg_catalog as $$
  select * from public.bookings where date = p_date and
    (status = 'paid' or (status = 'pending' and created_at + interval '30 minutes' > statement_timestamp()));
$$;

-- Explicit RPC makes app writes fail closed if migration 007 is not installed.
-- Defaults (id, created_at) always come from DB, never from the client payload.
create function public.create_booking_guarded(p_booking jsonb)
returns table(id uuid) language plpgsql set search_path = pg_catalog as $$
begin
  if p_booking->>'status' not in ('pending','paid') then
    raise exception 'Invalid initial booking status' using errcode = '23514';
  end if;
  return query insert into public.bookings (
    type,package_id,date,time,block_start,block_end,players,addons,
    customer_name,customer_phone,customer_email,note,total_eur,deposit_eur,status,
    merchant_reference,voucher_code,voucher_discount_eur,
    invitation_type,invitation_lang,celebrant_name,celebrant_age
  ) values (
    p_booking->>'type',p_booking->>'package_id',(p_booking->>'date')::date,
    p_booking->>'time',p_booking->>'block_start',p_booking->>'block_end',
    (p_booking->>'players')::integer,p_booking->'addons',
    p_booking->>'customer_name',p_booking->>'customer_phone',p_booking->>'customer_email',
    p_booking->>'note',(p_booking->>'total_eur')::numeric,(p_booking->>'deposit_eur')::numeric,
    p_booking->>'status',p_booking->>'merchant_reference',p_booking->>'voucher_code',
    coalesce((p_booking->>'voucher_discount_eur')::numeric,0),
    p_booking->>'invitation_type',p_booking->>'invitation_lang',
    p_booking->>'celebrant_name',(p_booking->>'celebrant_age')::integer
  ) returning bookings.id;
end $$;

create function public.settle_booking_guarded(p_ref text)
returns text language plpgsql set search_path = pg_catalog as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where merchant_reference = p_ref for update;
  if not found then return 'not_found'; end if;
  if b.status = 'paid' then return 'already_paid'; end if;
  -- Sticky: callbacks must never resurrect a booking after a recorded conflict.
  if b.payment_conflict_at is not null then return 'conflict'; end if;
  if b.status not in ('pending','expired') then return 'not_payable'; end if;
  begin
    update public.bookings set status = 'paid' where id = b.id;
  exception when exclusion_violation then
    update public.bookings set status = 'expired', payment_conflict_at = clock_timestamp(),
      note = concat_ws(' ', note, '[PAYMENT_CONFLICT] Mokėjimas gautas, laikas užimtas. Reikia rankinės peržiūros / grąžinimo.')
    where id = b.id;
    return 'conflict';
  end;
  return 'paid';
end $$;

-- Invoker privileges + existing RLS. Only trusted server service_role may call.
revoke all on function public.booking_guard_range(date,text,text,text,jsonb,text,boolean) from public, anon, authenticated;
revoke all on function public.booking_release_expired() from public, anon, authenticated;
revoke all on function public.expire_pending_bookings() from public, anon, authenticated;
revoke all on function public.active_bookings_for_date(date) from public, anon, authenticated;
revoke all on function public.create_booking_guarded(jsonb) from public, anon, authenticated;
revoke all on function public.settle_booking_guarded(text) from public, anon, authenticated;
grant execute on function public.booking_guard_range(date,text,text,text,jsonb,text,boolean),
  public.booking_release_expired(), public.expire_pending_bookings(),
  public.active_bookings_for_date(date), public.create_booking_guarded(jsonb),
  public.settle_booking_guarded(text) to service_role;
notify pgrst, 'reload schema';
commit;
