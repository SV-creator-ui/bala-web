-- Idempotency lease for booking & voucher email sending.
-- Motyvacija: iki šiol vienintelis `emails_sent_at` stulpelis atliko dvi
-- semantiškai skirtingas roles — „claim" (kad tik vienas kviesėjas siųstų)
-- IR „sent" (kad ateity neišsiųstume dublikatų). Toks combinuotas naudojimas
-- turi crash-window'ą: procesas nustato `emails_sent_at = now()`, tada
-- Vercel function timeout'ina prieš `sendMail()` — booking'as visam laikui
-- pažymėtas „sent", nors laiškas neišsiųstas.
--
-- Šis migration atskiria roles:
--  • `email_send_claimed_at` — lease (perimamas jei senesnis nei 10 min)
--  • `emails_sent_at`        — nustatomas TIK po sėkmingo send (nekeičiama)
--
-- Migracija saugu prod'e: tik prideda nullable stulpelius, jokio esamų
-- duomenų perrašymo. Iš karto suderinamas su senomis rezervacijomis, nes
-- claim yra INDIREKTUS filtras — jei stulpelis NULL (visos esamos eilutės),
-- claim'inama pirmam kviesėjui, kaip ir tikimasi.

begin;

alter table public.bookings add column if not exists email_send_claimed_at timestamptz;
alter table public.vouchers add column if not exists email_send_claimed_at timestamptz;

-- Neprivalomi partial indeks'ai — pagreitina „ar yra stale claim" scan'ą jei
-- ateity būtų monitoring užklausa. Šiuo momentu app'as juos naudoja
-- netiesiogiai per WHERE filter'ius; PostgreSQL vis tiek gali naudoti.
create index if not exists bookings_email_send_claimed_at_idx
  on public.bookings (email_send_claimed_at)
  where email_send_claimed_at is not null;

create index if not exists vouchers_email_send_claimed_at_idx
  on public.vouchers (email_send_claimed_at)
  where email_send_claimed_at is not null;

notify pgrst, 'reload schema';
commit;
