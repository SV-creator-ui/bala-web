-- Read-only P1 discount migration preflight. Expected result: every query
-- returns zero rows. The transaction is rolled back and changes nothing.
begin;

create function pg_temp.try_jsonb(value text) returns jsonb
language plpgsql immutable as $$
begin
  return value::jsonb;
exception when others then
  return null;
end $$;

create function pg_temp.try_integer(value text) returns integer
language plpgsql immutable as $$
begin
  return value::integer;
exception when others then
  return null;
end $$;

create function pg_temp.try_numeric(value text) returns numeric
language plpgsql immutable as $$
begin
  return value::numeric;
exception when others then
  return null;
end $$;

create function pg_temp.try_date(value text) returns date
language plpgsql immutable as $$
begin
  return value::date;
exception when others then
  return null;
end $$;

create function pg_temp.try_boolean(value text) returns boolean
language plpgsql immutable as $$
begin
  return value::boolean;
exception when others then
  return null;
end $$;

-- Duplicate normalized voucher or promo definitions would make row locking
-- ambiguous. Both result sets must be empty.
select upper(btrim(code)) normalized_code, count(*) row_count
from public.vouchers
where code is not null
group by upper(btrim(code))
having count(*) > 1;

select upper(btrim(time)) normalized_code, count(*) row_count
from public.blackouts
where date = date '1900-01-03' and time is not null
group by upper(btrim(time))
having count(*) > 1;

-- Invalid promo JSON or missing/corrupt fields. Must return zero rows.
with promos as (
  select id, time, pg_temp.try_jsonb(reason) data
  from public.blackouts where date = date '1900-01-03'
)
select id, time, 'invalid promo definition' issue
from promos
where data is null
   or jsonb_typeof(data) <> 'object'
   or data->>'discount_type' not in ('percent','fixed')
   or pg_temp.try_numeric(data->>'discount_value') is null
   or pg_temp.try_numeric(data->>'discount_value') < 0
   or pg_temp.try_integer(data->>'max_uses') is null
   or pg_temp.try_integer(data->>'max_uses') < 0
   or pg_temp.try_integer(data->>'used_count') is null
   or pg_temp.try_integer(data->>'used_count') < 0
   or pg_temp.try_integer(data->>'min_visits_required') is null
   or pg_temp.try_integer(data->>'min_visits_required') < 0
   or pg_temp.try_date(data->>'valid_from') is null
   or pg_temp.try_date(data->>'valid_until') is null
   or pg_temp.try_boolean(data->>'cancelled') is null
   or jsonb_typeof(data->'applies_to') <> 'array';

-- Active bookings may not combine both discount kinds.
select id, merchant_reference, voucher_code, note
from public.bookings
where voucher_code is not null
  and note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]';

-- A voucher discount without its code cannot be claimed safely.
select id, merchant_reference, voucher_discount_eur
from public.bookings
where voucher_discount_eur <> 0 and voucher_code is null;

-- More than one currently active booking for a voucher is ambiguous and must
-- be resolved manually before migration.
with active_voucher_bookings as (
  select *
  from public.bookings
  where voucher_code is not null
    and (
      status = 'paid'
      or (status = 'pending' and created_at + interval '30 minutes' > statement_timestamp())
    )
)
select upper(btrim(voucher_code)) voucher_code,
       count(*) booking_count,
       array_agg(merchant_reference order by created_at) booking_refs
from active_voucher_bookings
group by upper(btrim(voucher_code))
having count(*) > 1;

-- Missing, expired, wrongly redeemed or arithmetically inconsistent vouchers.
-- Paid + active is allowed: migration 008 will finalize that voucher.
with active_voucher_bookings as (
  select *
  from public.bookings
  where voucher_code is not null
    and (
      status = 'paid'
      or (status = 'pending' and created_at + interval '30 minutes' > statement_timestamp())
    )
)
select b.id, b.merchant_reference, b.status booking_status,
       b.voucher_code, b.voucher_discount_eur, v.status voucher_status,
       v.redeemed_booking_ref
from active_voucher_bookings b
left join public.vouchers v
  on upper(btrim(v.code)) = upper(btrim(b.voucher_code))
where v.id is null
   or (v.valid_until is not null
       and v.valid_until < timezone('Europe/Vilnius', statement_timestamp())::date)
   or (b.status = 'pending' and v.status <> 'active')
   or (b.status = 'paid' and not (
        v.status = 'active'
        or (v.status = 'redeemed' and v.redeemed_booking_ref = b.merchant_reference)
      ))
   or b.voucher_discount_eur <> least(v.amount_eur, b.total_eur);

-- Active promo bookings must point to a valid definition and fit the remaining
-- usage capacity. The prior app stores promo identity in booking.note.
with promo_defs as (
  select upper(btrim(time)) code, pg_temp.try_jsonb(reason) data
  from public.blackouts where date = date '1900-01-03'
),
active_promo_bookings as (
  select b.*,
         upper(substring(note from '\[PROMO:([^:\]]+):')) promo_code,
         substring(note from '\[PROMO:[^:]+:-([0-9]+(\.[0-9]+)?)€\]')::numeric promo_discount
  from public.bookings b
  where status = 'pending'
    and created_at + interval '30 minutes' > statement_timestamp()
    and note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]'
),
capacity as (
  select p.code,
         coalesce(pg_temp.try_integer(p.data->>'max_uses'), 1) max_uses,
         coalesce(pg_temp.try_integer(p.data->>'used_count'),
                  case when p.data->>'used_at' is null then 0 else 1 end) used_count,
         count(b.id)::integer pending_count,
         array_agg(b.merchant_reference order by b.created_at)
           filter (where b.id is not null) booking_refs
  from promo_defs p
  left join active_promo_bookings b on b.promo_code = p.code
  where p.data is not null
  group by p.code, p.data
)
select code, max_uses, used_count, pending_count, booking_refs
from capacity
where max_uses > 0 and used_count + pending_count > max_uses;

-- The stored counter may exceed currently paid bookings (for example after a
-- later cancellation), but it must never be lower than tagged paid bookings.
with promo_defs as (
  select upper(btrim(time)) code, pg_temp.try_jsonb(reason) data
  from public.blackouts where date = date '1900-01-03'
),
paid_uses as (
  select upper(substring(note from '\[PROMO:([^:\]]+):')) code,
         count(*)::integer paid_count
  from public.bookings
  where status = 'paid'
    and note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]'
  group by upper(substring(note from '\[PROMO:([^:\]]+):'))
)
select u.code, u.paid_count,
       coalesce(pg_temp.try_integer(p.data->>'used_count'),
                case when p.data->>'used_at' is null then 0 else 1 end) stored_count
from paid_uses u
left join promo_defs p on p.code = u.code
where p.code is null
   or u.paid_count > coalesce(pg_temp.try_integer(p.data->>'used_count'),
                              case when p.data->>'used_at' is null then 0 else 1 end);

-- Missing promo definitions for live pending bookings. Must return zero rows.
with promo_defs as (
  select upper(btrim(time)) code
  from public.blackouts where date = date '1900-01-03'
),
active_promo_bookings as (
  select id, merchant_reference,
         upper(substring(note from '\[PROMO:([^:\]]+):')) promo_code
  from public.bookings
  where status = 'pending'
    and created_at + interval '30 minutes' > statement_timestamp()
    and note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]'
)
select b.id, b.merchant_reference, b.promo_code
from active_promo_bookings b
left join promo_defs p on p.code = b.promo_code
where p.code is null;

-- Live pending promo bookings that migration 008 would reject because their
-- stored discount or assignment no longer matches the promo definition.
with promo_defs as (
  select upper(btrim(time)) code, pg_temp.try_jsonb(reason) data
  from public.blackouts where date = date '1900-01-03'
),
active_promo_bookings as (
  select b.*,
         upper(substring(note from '\[PROMO:([^:\]]+):')) promo_code,
         substring(note from '\[PROMO:[^:]+:-([0-9]+(\.[0-9]+)?)€\]')::numeric promo_discount
  from public.bookings b
  where status = 'pending'
    and created_at + interval '30 minutes' > statement_timestamp()
    and note ~ '\[PROMO:[^:\]]+:-[0-9]+(\.[0-9]+)?€\]'
),
checked as (
  select b.*, p.data,
    case
      when p.data->>'discount_type' = 'percent' then
        least(b.total_eur + b.promo_discount,
          round((b.total_eur + b.promo_discount) * pg_temp.try_numeric(p.data->>'discount_value') / 100, 2))
      when p.data->>'discount_type' = 'fixed' then
        least(b.total_eur + b.promo_discount, pg_temp.try_numeric(p.data->>'discount_value'))
      else null
    end expected_discount
  from active_promo_bookings b
  join promo_defs p on p.code = b.promo_code
)
select id, merchant_reference, promo_code, promo_discount, expected_discount
from checked
where data is null
   or coalesce(pg_temp.try_boolean(data->>'cancelled'), false)
   or pg_temp.try_date(data->>'valid_from') > timezone('UTC', statement_timestamp())::date
   or pg_temp.try_date(data->>'valid_until') < timezone('UTC', statement_timestamp())::date
   or not (coalesce(data->'applies_to', '[]'::jsonb) ? type)
   or (coalesce(btrim(data->>'assigned_email'), '') <> ''
       and lower(btrim(data->>'assigned_email')) <> lower(btrim(customer_email)))
   or coalesce(pg_temp.try_integer(data->>'min_visits_required'), 0) > (
        select count(*) from public.bookings prior
        where prior.status = 'paid' and prior.type in ('room','game')
          and prior.id <> checked.id
          and lower(btrim(prior.customer_email)) = lower(btrim(checked.customer_email))
      )
   or promo_discount is distinct from expected_discount;

rollback;
