-- READ ONLY. Run before migration 007. No data is modified.
-- 1. Invalid active data: must return zero rows. Fix deliberately, never guess.
select id, merchant_reference, date, time, type, package_id
from public.bookings
where (status = 'paid' or (status = 'pending' and created_at + interval '30 minutes' > statement_timestamp()))
and (time !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
  or type not in ('room','party','game')
  or (type = 'party' and (package_id is null or package_id not in ('maksi','vip','gold'))));

-- 2. Overlaps with existing business gaps, including historical paid records.
-- Run only after query 1 returns zero rows (otherwise time casts may fail).
with active as (
  select id, merchant_reference, type, date + time::time as starts,
    date + time::time + make_interval(mins =>
      case when type = 'party' then
        case package_id when 'maksi' then 120 when 'vip' then 150 when 'gold' then 180 end
        + case when addons ? 'extratime' then 15 else 0 end
      else 60 end) as ends
  from public.bookings
  where status = 'paid' or (status = 'pending' and created_at + interval '30 minutes' > statement_timestamp())
)
select a.id as earlier_id, a.merchant_reference as earlier_ref,
       b.id as later_id, b.merchant_reference as later_ref, a.starts, a.ends, b.starts as next_start
from active a join active b
on (a.starts < b.starts or (a.starts = b.starts and a.id < b.id))
and a.ends + make_interval(mins => case when b.type = 'party' then 30 when a.type = 'party' then 15 else 0 end) > b.starts
order by a.starts;
