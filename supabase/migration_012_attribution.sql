-- Reklamos atribucija: iš kur atėjo klientas (UTM, Meta/Google paspaudimas) +
-- Meta CAPI signalai (fbc/fbp/IP/user agent — tik su slapukų sutikimu).
-- Pildo /api/bookings ir /api/vouchers po įrašo sukūrimo (best-effort).
begin;

alter table public.bookings add column if not exists attribution jsonb;
alter table public.vouchers add column if not exists attribution jsonb;

commit;
