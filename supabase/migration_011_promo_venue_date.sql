-- Promo validity must use the venue's calendar date, not UTC.
-- This definition matches the current production claim_booking_promo function;
-- only the promo date source and its local variable name are changed.
begin;

create or replace function public.claim_booking_promo(
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
  venue_today date := timezone('Europe/Vilnius', statement_timestamp())::date;
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
         or venue_today < (promo->>'valid_from')::date
         or venue_today > (promo->>'valid_until')::date then
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

notify pgrst, 'reload schema';
commit;
