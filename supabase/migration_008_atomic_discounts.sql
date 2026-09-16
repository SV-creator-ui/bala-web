-- P1: atomic voucher/promo reservation and settlement.
-- Apply manually AFTER migration_007 and BEFORE deploying matching app code.
begin;

lock table public.bookings in access exclusive mode;
lock table public.vouchers in access exclusive mode;
lock table public.blackouts in access exclusive mode;

alter table public.bookings
  add column promo_code text,
  add column promo_discount_eur numeric(8,2) not null default 0;
alter table public.bookings add constraint bookings_promo_discount_nonnegative
  check (promo_discount_eur >= 0);
alter table public.bookings add constraint bookings_voucher_discount_nonnegative
  check (voucher_discount_eur >= 0);
alter table public.bookings add constraint bookings_one_discount_kind check (
  not (voucher_code is not null and promo_code is not null)
);
alter table public.bookings add constraint bookings_discount_requires_code check (
  (voucher_discount_eur = 0 or voucher_code is not null)
  and (promo_discount_eur = 0 or promo_code is not null)
);

-- Promo definitions are JSON sentinel rows. A normalized unique code makes
-- SELECT ... FOR UPDATE a reliable serialization lock.
create unique index blackouts_promo_code_unique
  on public.blackouts ((upper(btrim(time))))
  where date = date '1900-01-03' and time is not null;

create table public.voucher_booking_claims (
  booking_id uuid primary key
    references public.bookings(id) on delete cascade deferrable initially deferred,
  booking_ref text not null unique,
  voucher_code text not null,
  discount_eur numeric(8,2) not null check (discount_eur >= 0),
  state text not null check (state in ('reserved','redeemed','released')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);
-- A deliberately reactivated voucher may be claimed after an old redemption,
-- but only one live pending reservation may own it.
create unique index voucher_booking_claims_one_reservation
  on public.voucher_booking_claims ((upper(btrim(voucher_code))))
  where state = 'reserved';
alter table public.voucher_booking_claims enable row level security;

create table public.promo_booking_claims (
  booking_id uuid primary key
    references public.bookings(id) on delete cascade deferrable initially deferred,
  booking_ref text not null unique,
  promo_code text not null,
  discount_eur numeric(8,2) not null check (discount_eur >= 0),
  state text not null check (state in ('reserved','redeemed','released')),
  created_at timestamptz not null default now(),
  redeemed_at timestamptz
);
create index promo_booking_claims_code_state_idx
  on public.promo_booking_claims ((upper(btrim(promo_code))), state);
alter table public.promo_booking_claims enable row level security;

-- SQLSTATE P0002 means that a discount claim is invalid or unavailable.
create function public.claim_booking_voucher(
  p_booking_id uuid,
  p_booking_ref text,
  p_code text,
  p_booking_status text,
  p_base_total numeric,
  p_expected_discount numeric default null
) returns numeric
language plpgsql volatile set search_path = pg_catalog as $$
declare
  voucher public.vouchers%rowtype;
  claim public.voucher_booking_claims%rowtype;
  claim_exists boolean;
  normalized_code text := upper(btrim(p_code));
  discount numeric(8,2);
  venue_today date := timezone('Europe/Vilnius', statement_timestamp())::date;
begin
  if normalized_code is null or normalized_code = '' or p_base_total < 0 then
    raise exception 'Invalid voucher claim input' using errcode = 'P0002';
  end if;
  if p_booking_status not in ('pending','paid') then
    raise exception 'Voucher cannot be claimed for status %', p_booking_status using errcode = 'P0002';
  end if;

  select * into voucher from public.vouchers
  where upper(btrim(code)) = normalized_code for update;
  if not found then
    raise exception 'Voucher not found' using errcode = 'P0002';
  end if;

  discount := least(voucher.amount_eur, p_base_total)::numeric(8,2);

  select * into claim from public.voucher_booking_claims
  where booking_id = p_booking_id for update;
  claim_exists := found;
  if claim_exists then
    if upper(btrim(claim.voucher_code)) <> normalized_code
       or claim.booking_ref <> p_booking_ref then
      raise exception 'Booking voucher claim differs' using errcode = 'P0002';
    end if;
    if claim.state = 'redeemed' then return claim.discount_eur; end if;
    if claim.state = 'reserved' and p_booking_status = 'pending' then return claim.discount_eur; end if;
    if claim.state = 'reserved' and p_booking_status = 'paid' then
      discount := claim.discount_eur;
    end if;
  end if;
  if p_expected_discount is not null and discount <> p_expected_discount then
    raise exception 'Voucher discount changed' using errcode = 'P0002';
  end if;

  if voucher.valid_until is not null and voucher.valid_until < venue_today then
    raise exception 'Voucher expired' using errcode = 'P0002';
  end if;
  if voucher.status = 'redeemed' then
    if voucher.redeemed_booking_ref <> p_booking_ref or p_booking_status <> 'paid' then
      raise exception 'Voucher already redeemed' using errcode = 'P0002';
    end if;
  elsif voucher.status <> 'active' then
    raise exception 'Voucher is not active' using errcode = 'P0002';
  end if;

  insert into public.voucher_booking_claims (
    booking_id, booking_ref, voucher_code, discount_eur, state, redeemed_at
  ) values (
    p_booking_id, p_booking_ref, normalized_code, discount,
    case when p_booking_status = 'paid' then 'redeemed' else 'reserved' end,
    case when p_booking_status = 'paid' then statement_timestamp() else null end
  )
  on conflict (booking_id) do update set
    booking_ref = excluded.booking_ref,
    voucher_code = excluded.voucher_code,
    discount_eur = excluded.discount_eur,
    state = excluded.state,
    redeemed_at = excluded.redeemed_at;

  if p_booking_status = 'paid' then
    update public.vouchers set
      status = 'redeemed',
      redeemed_at = coalesce(redeemed_at, statement_timestamp()),
      redeemed_booking_ref = p_booking_ref
    where id = voucher.id;
  end if;
  return discount;
exception
  when unique_violation then
    raise exception 'Voucher is reserved by another booking' using errcode = 'P0002';
end $$;

create function public.claim_booking_promo(
  p_booking_id uuid,
  p_booking_ref text,
  p_code text,
  p_email text,
  p_type text,
  p_base_total numeric,
  p_booking_status text,
  p_expected_discount numeric default null
) returns numeric
language plpgsql volatile set search_path = pg_catalog as $$
declare
  promo_row record;
  promo jsonb;
  claim public.promo_booking_claims%rowtype;
  claim_exists boolean;
  normalized_code text := upper(btrim(p_code));
  max_uses integer;
  used_count integer;
  reserved_count integer;
  min_visits integer;
  prior_visits integer;
  discount_value numeric;
  discount numeric(8,2);
  utc_today date := timezone('UTC', statement_timestamp())::date;
begin
  if normalized_code is null or normalized_code = '' or p_base_total < 0 then
    raise exception 'Invalid promo claim input' using errcode = 'P0002';
  end if;
  if p_booking_status not in ('pending','paid') then
    raise exception 'Promo cannot be claimed for status %', p_booking_status using errcode = 'P0002';
  end if;

  select id, reason into promo_row from public.blackouts
  where date = date '1900-01-03' and upper(btrim(time)) = normalized_code
  for update;
  if not found then
    raise exception 'Promo code not found' using errcode = 'P0002';
  end if;
  begin
    promo := promo_row.reason::jsonb;
  exception when others then
    raise exception 'Promo definition is invalid' using errcode = 'P0002';
  end;

  select * into claim from public.promo_booking_claims
  where booking_id = p_booking_id for update;
  claim_exists := found;
  if claim_exists then
    if upper(btrim(claim.promo_code)) <> normalized_code or claim.booking_ref <> p_booking_ref then
      raise exception 'Booking already has another promo claim' using errcode = 'P0002';
    end if;
    if claim.state = 'redeemed' then return claim.discount_eur; end if;
    if claim.state = 'reserved' and p_booking_status = 'pending' then return claim.discount_eur; end if;
  end if;

  -- An existing reservation keeps its discount for the current payment hold.
  -- Fresh and released claims must pass all current promo rules.
  if not claim_exists or claim.state = 'released' then
    begin
      if coalesce((promo->>'cancelled')::boolean, false) then
        raise exception 'Promo code is cancelled' using errcode = 'P0002';
      end if;
      if promo->>'valid_from' is null or promo->>'valid_until' is null
         or utc_today < (promo->>'valid_from')::date
         or utc_today > (promo->>'valid_until')::date then
        raise exception 'Promo code is outside its validity period' using errcode = 'P0002';
      end if;
      if jsonb_typeof(promo->'applies_to') <> 'array'
         or not (promo->'applies_to' ? p_type) then
        raise exception 'Promo code does not apply to this booking type' using errcode = 'P0002';
      end if;
      if coalesce(btrim(promo->>'assigned_email'), '') <> ''
         and lower(btrim(promo->>'assigned_email')) <> lower(btrim(p_email)) then
        raise exception 'Promo code belongs to another email' using errcode = 'P0002';
      end if;

      min_visits := coalesce((promo->>'min_visits_required')::integer, 0);
      if min_visits < 0 then raise exception 'Invalid promo visit limit' using errcode = 'P0002'; end if;
      if min_visits > 0 then
        select count(*)::integer into prior_visits from public.bookings
        where status = 'paid' and type in ('room','game') and id <> p_booking_id
          and lower(btrim(customer_email)) = lower(btrim(p_email));
        if prior_visits < min_visits then
          raise exception 'Promo visit requirement not met' using errcode = 'P0002';
        end if;
      end if;
    exception
      when sqlstate 'P0002' then raise;
      when others then raise exception 'Promo definition is invalid' using errcode = 'P0002';
    end;
  end if;

  if claim_exists and claim.state = 'reserved' and p_booking_status = 'paid' then
    discount := claim.discount_eur;
  else
    begin
      discount_value := (promo->>'discount_value')::numeric;
      if discount_value < 0 then raise exception 'Invalid promo discount' using errcode = 'P0002'; end if;
      if promo->>'discount_type' = 'percent' then
        discount := least(p_base_total, round(p_base_total * discount_value / 100, 2))::numeric(8,2);
      elsif promo->>'discount_type' = 'fixed' then
        discount := least(p_base_total, discount_value)::numeric(8,2);
      else
        raise exception 'Unknown promo discount type' using errcode = 'P0002';
      end if;
    exception
      when sqlstate 'P0002' then raise;
      when others then raise exception 'Promo discount is invalid' using errcode = 'P0002';
    end;
  end if;
  if claim_exists and claim.discount_eur <> discount then
    raise exception 'Stored promo discount differs' using errcode = 'P0002';
  end if;
  if p_expected_discount is not null and discount <> p_expected_discount then
    raise exception 'Promo discount changed' using errcode = 'P0002';
  end if;

  begin
    max_uses := coalesce((promo->>'max_uses')::integer, 1);
    used_count := coalesce(
      (promo->>'used_count')::integer,
      case when promo->>'used_at' is null then 0 else 1 end
    );
  exception when others then
    raise exception 'Promo usage counters are invalid' using errcode = 'P0002';
  end;
  if max_uses < 0 or used_count < 0 then
    raise exception 'Promo usage counters are invalid' using errcode = 'P0002';
  end if;

  if not claim_exists or claim.state = 'released' then
    select count(*)::integer into reserved_count
    from public.promo_booking_claims
    where upper(btrim(promo_code)) = normalized_code
      and state = 'reserved' and booking_id <> p_booking_id;
    if max_uses > 0 and used_count + reserved_count >= max_uses then
      raise exception 'Promo usage limit reached' using errcode = 'P0002';
    end if;
  end if;

  insert into public.promo_booking_claims (
    booking_id, booking_ref, promo_code, discount_eur, state, redeemed_at
  ) values (
    p_booking_id, p_booking_ref, normalized_code, discount,
    case when p_booking_status = 'paid' then 'redeemed' else 'reserved' end,
    case when p_booking_status = 'paid' then statement_timestamp() else null end
  )
  on conflict (booking_id) do update set
    booking_ref = excluded.booking_ref,
    promo_code = excluded.promo_code,
    discount_eur = excluded.discount_eur,
    state = excluded.state,
    redeemed_at = excluded.redeemed_at;

  if p_booking_status = 'paid' then
    promo := jsonb_set(promo, '{used_count}', to_jsonb(used_count + 1), true);
    promo := jsonb_set(promo, '{used_at}', to_jsonb(statement_timestamp()::text), true);
    promo := jsonb_set(promo, '{used_booking_id}', to_jsonb(p_booking_id::text), true);
    promo := jsonb_set(promo, '{used_booking_ref}', to_jsonb(p_booking_ref), true);
    update public.blackouts set reason = promo::text where id = promo_row.id;
  end if;
  return discount;
end $$;

create function public.booking_discount_status_guard() returns trigger
language plpgsql set search_path = pg_catalog as $$
declare base_total numeric;
begin
  if TG_OP = 'DELETE' then
    if OLD.status = 'pending' then
      update public.voucher_booking_claims set state = 'released'
      where booking_id = OLD.id and state = 'reserved';
      update public.promo_booking_claims set state = 'released'
      where booking_id = OLD.id and state = 'reserved';
    end if;
    return OLD;
  end if;

  if TG_OP = 'UPDATE' then
    if NEW.voucher_code is distinct from OLD.voucher_code
       or NEW.voucher_discount_eur is distinct from OLD.voucher_discount_eur
       or NEW.promo_code is distinct from OLD.promo_code
       or NEW.promo_discount_eur is distinct from OLD.promo_discount_eur then
      raise exception 'Booking discount fields are immutable' using errcode = '23514';
    end if;
    if NEW.status is not distinct from OLD.status then return NEW; end if;
    if OLD.status = 'pending' and NEW.status in ('expired','cancelled') then
      update public.voucher_booking_claims set state = 'released'
      where booking_id = NEW.id and state = 'reserved';
      update public.promo_booking_claims set state = 'released'
      where booking_id = NEW.id and state = 'reserved';
      return NEW;
    end if;
    if not (
      (NEW.status in ('pending','paid') and OLD.status not in ('pending','paid'))
      or (OLD.status = 'pending' and NEW.status = 'paid')
    ) then return NEW; end if;
  end if;

  if NEW.voucher_code is not null then
    perform public.claim_booking_voucher(
      NEW.id, NEW.merchant_reference, NEW.voucher_code, NEW.status,
      NEW.total_eur, NEW.voucher_discount_eur
    );
  elsif NEW.promo_code is not null then
    base_total := NEW.total_eur + NEW.promo_discount_eur;
    perform public.claim_booking_promo(
      NEW.id, NEW.merchant_reference, NEW.promo_code,
      NEW.customer_email, NEW.type, base_total, NEW.status,
      NEW.promo_discount_eur
    );
  end if;
  return NEW;
end $$;

-- Admin promo edits still submit the whole JSON object. Reject a stale edit
-- rather than allowing it to overwrite a redemption counter that advanced
-- after the admin read the row.
create function public.promo_usage_counter_guard() returns trigger
language plpgsql set search_path = pg_catalog as $$
declare
  old_promo jsonb;
  new_promo jsonb;
  old_count integer;
  new_count integer;
begin
  if OLD.date <> date '1900-01-03' or NEW.date <> date '1900-01-03'
     or upper(btrim(OLD.time)) <> upper(btrim(NEW.time)) then
    return NEW;
  end if;
  begin
    old_promo := OLD.reason::jsonb;
    new_promo := NEW.reason::jsonb;
    old_count := coalesce((old_promo->>'used_count')::integer,
      case when old_promo->>'used_at' is null then 0 else 1 end);
    new_count := coalesce((new_promo->>'used_count')::integer,
      case when new_promo->>'used_at' is null then 0 else 1 end);
  exception when others then
    raise exception 'Promo definition is invalid' using errcode = 'P0002';
  end;
  if new_count < old_count then
    raise exception 'Promo usage counter changed concurrently; retry the edit'
      using errcode = '40001';
  end if;
  return NEW;
end $$;

create trigger promo_usage_counter_before_update
before update of reason,date,time on public.blackouts
for each row execute function public.promo_usage_counter_guard();

-- Backfill explicit promo columns before the immutability trigger exists.
update public.bookings set
  promo_code = upper(substring(note from '\[PROMO:([^:\]]+):')),
  promo_discount_eur = substring(note from '\[PROMO:[^:]+:-([0-9]+(\.[0-9]+)?)€\]')::numeric
where note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]';

-- Paid usages are already present in promo JSON used_count. Seed claims only
-- for callback idempotency, without incrementing counters again.
insert into public.promo_booking_claims (
  booking_id, booking_ref, promo_code, discount_eur, state, redeemed_at
)
select id, merchant_reference, promo_code, promo_discount_eur, 'redeemed', created_at
from public.bookings
where status = 'paid' and promo_code is not null
on conflict (booking_id) do nothing;

-- Claim only live pending rows. Stale rows retain migration_007's existing
-- lazy expiration behavior and do not reserve discount capacity.
do $$
declare b public.bookings%rowtype;
begin
  for b in
    select * from public.bookings
    where status = 'paid' and voucher_code is not null
    order by created_at, id
  loop
    perform public.claim_booking_voucher(
      b.id, b.merchant_reference, b.voucher_code, b.status,
      b.total_eur, b.voucher_discount_eur
    );
  end loop;

  for b in
    select * from public.bookings
    where status = 'pending' and created_at + interval '30 minutes' > statement_timestamp()
      and voucher_code is not null
    order by created_at, id
  loop
    perform public.claim_booking_voucher(
      b.id, b.merchant_reference, b.voucher_code, b.status,
      b.total_eur, b.voucher_discount_eur
    );
  end loop;

  for b in
    select * from public.bookings
    where status = 'pending' and created_at + interval '30 minutes' > statement_timestamp()
      and promo_code is not null
    order by created_at, id
  loop
    perform public.claim_booking_promo(
      b.id, b.merchant_reference, b.promo_code,
      b.customer_email, b.type, b.total_eur + b.promo_discount_eur,
      b.status, b.promo_discount_eur
    );
  end loop;
end $$;

create trigger booking_discount_after_insert
after insert on public.bookings
for each row execute function public.booking_discount_status_guard();
create trigger booking_discount_after_update
after update of status,voucher_code,voucher_discount_eur,promo_code,promo_discount_eur
on public.bookings for each row execute function public.booking_discount_status_guard();
create trigger booking_discount_after_delete
after delete on public.bookings
for each row execute function public.booking_discount_status_guard();

-- DB owns discount validation/arithmetic, its reservation and final totals.
drop function public.create_booking_guarded(jsonb);
create function public.create_booking_guarded(p_booking jsonb)
returns table(
  id uuid,
  total_eur numeric,
  deposit_eur numeric,
  voucher_discount_eur numeric,
  promo_discount_eur numeric
) language plpgsql set search_path = pg_catalog as $$
declare
  booking_id uuid := gen_random_uuid();
  booking_status text := p_booking->>'status';
  booking_ref text := p_booking->>'merchant_reference';
  booking_type text := p_booking->>'type';
  booking_email text := p_booking->>'customer_email';
  voucher_code text := nullif(upper(btrim(p_booking->>'voucher_code')), '');
  promo_code text := nullif(upper(btrim(p_booking->>'promo_code')), '');
  note_text text := p_booking->>'note';
  base_total numeric;
  base_deposit numeric;
  actual_total numeric;
  actual_deposit numeric;
  voucher_discount numeric(8,2) := 0;
  promo_discount numeric(8,2) := 0;
  legacy_promo_discount numeric;
begin
  if booking_status not in ('pending','paid') then
    raise exception 'Invalid initial booking status' using errcode = '23514';
  end if;

  -- Old app compatibility during migration-first rollout.
  if promo_code is null and note_text ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]' then
    promo_code := upper(substring(note_text from '\[PROMO:([^:\]]+):'));
    legacy_promo_discount := substring(note_text from '\[PROMO:[^:]+:-([0-9]+(\.[0-9]+)?)€\]')::numeric;
  end if;
  if voucher_code is not null and promo_code is not null then
    raise exception 'Voucher and promo cannot be combined' using errcode = 'P0002';
  end if;

  base_total := coalesce(
    nullif(p_booking->>'base_total_eur', '')::numeric,
    (p_booking->>'total_eur')::numeric + coalesce(legacy_promo_discount, 0)
  );
  base_deposit := coalesce(
    nullif(p_booking->>'base_deposit_eur', '')::numeric,
    (p_booking->>'deposit_eur')::numeric
  );
  if base_total < 0 or base_deposit < 0 then
    raise exception 'Invalid booking price' using errcode = '23514';
  end if;

  if voucher_code is not null then
    voucher_discount := public.claim_booking_voucher(
      booking_id, booking_ref, voucher_code, booking_status, base_total,
      nullif(p_booking->>'voucher_discount_eur', '')::numeric
    );
  elsif promo_code is not null then
    promo_discount := public.claim_booking_promo(
      booking_id, booking_ref, promo_code, booking_email, booking_type,
      base_total, booking_status,
      coalesce(nullif(p_booking->>'promo_discount_eur', '')::numeric, legacy_promo_discount)
    );
  end if;

  actual_total := case
    when promo_code is not null then greatest(0, base_total - promo_discount)
    else base_total
  end;
  actual_deposit := least(
    base_deposit,
    greatest(0, base_total - voucher_discount - promo_discount)
  );

  return query insert into public.bookings (
    id,type,package_id,date,time,block_start,block_end,players,addons,
    customer_name,customer_phone,customer_email,note,total_eur,deposit_eur,status,
    merchant_reference,voucher_code,voucher_discount_eur,promo_code,promo_discount_eur,
    invitation_type,invitation_lang,celebrant_name,celebrant_age
  ) values (
    booking_id,booking_type,p_booking->>'package_id',(p_booking->>'date')::date,
    p_booking->>'time',p_booking->>'block_start',p_booking->>'block_end',
    (p_booking->>'players')::integer,p_booking->'addons',
    p_booking->>'customer_name',p_booking->>'customer_phone',booking_email,
    note_text,actual_total,actual_deposit,booking_status,booking_ref,
    voucher_code,voucher_discount,promo_code,promo_discount,
    p_booking->>'invitation_type',p_booking->>'invitation_lang',
    p_booking->>'celebrant_name',(p_booking->>'celebrant_age')::integer
  ) returning bookings.id, bookings.total_eur, bookings.deposit_eur,
              bookings.voucher_discount_eur, bookings.promo_discount_eur;
end $$;

create function public.settle_booking_promo_guarded(p_booking_id uuid, p_promo_code text)
returns text language plpgsql set search_path = pg_catalog as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where id = p_booking_id for update;
  if not found then return 'not_found'; end if;
  if b.promo_code is null then return 'not_applicable'; end if;
  if upper(btrim(b.promo_code)) <> upper(btrim(p_promo_code)) then
    raise exception 'Promo code mismatch' using errcode = 'P0002';
  end if;
  if b.status <> 'paid' then return 'not_paid'; end if;
  perform public.claim_booking_promo(
    b.id, b.merchant_reference, b.promo_code, b.customer_email, b.type,
    b.total_eur + b.promo_discount_eur, 'paid', b.promo_discount_eur
  );
  return 'already_counted';
end $$;

-- Late settlement cannot bypass a released claim acquired by another booking.
create or replace function public.settle_booking_guarded(p_ref text)
returns text language plpgsql set search_path = pg_catalog as $$
declare b public.bookings%rowtype;
begin
  select * into b from public.bookings where merchant_reference = p_ref for update;
  if not found then return 'not_found'; end if;
  if b.status = 'paid' then return 'already_paid'; end if;
  if b.payment_conflict_at is not null then return 'conflict'; end if;
  if b.status not in ('pending','expired') then return 'not_payable'; end if;
  begin
    update public.bookings set status = 'paid' where id = b.id;
  exception
    when exclusion_violation then
      update public.bookings set status = 'expired', payment_conflict_at = clock_timestamp(),
        note = concat_ws(' ', note, '[PAYMENT_CONFLICT] Mokėjimas gautas, laikas užimtas. Reikia rankinės peržiūros / grąžinimo.')
      where id = b.id;
      return 'conflict';
    when sqlstate 'P0002' then
      update public.bookings set status = 'expired', payment_conflict_at = clock_timestamp(),
        note = concat_ws(' ', note, '[DISCOUNT_CONFLICT] Mokėjimas gautas, kuponas arba promo kodas nebegalioja. Reikia rankinės peržiūros / grąžinimo.')
      where id = b.id;
      return 'conflict';
  end;
  return 'paid';
end $$;

revoke all on table public.voucher_booking_claims, public.promo_booking_claims from anon, authenticated;
revoke all on function public.claim_booking_voucher(uuid,text,text,text,numeric,numeric) from public, anon, authenticated;
revoke all on function public.claim_booking_promo(uuid,text,text,text,text,numeric,text,numeric) from public, anon, authenticated;
revoke all on function public.booking_discount_status_guard() from public, anon, authenticated;
revoke all on function public.promo_usage_counter_guard() from public, anon, authenticated;
revoke all on function public.create_booking_guarded(jsonb) from public, anon, authenticated;
revoke all on function public.settle_booking_promo_guarded(uuid,text) from public, anon, authenticated;
grant execute on function public.claim_booking_voucher(uuid,text,text,text,numeric,numeric),
  public.claim_booking_promo(uuid,text,text,text,text,numeric,text,numeric),
  public.booking_discount_status_guard(), public.promo_usage_counter_guard(),
  public.create_booking_guarded(jsonb),
  public.settle_booking_promo_guarded(uuid,text) to service_role;

notify pgrst, 'reload schema';
commit;
