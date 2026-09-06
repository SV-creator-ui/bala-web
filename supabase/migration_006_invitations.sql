-- migration_006_invitations.sql
-- Gimtadienio kvietimo (svečiams) duomenys rezervacijoje.
-- Po apmokėjimo klientui el. paštu prisegamas pasirinkto tipo/kalbos kvietimo PDF.
--
-- invitation_type: NULL = kvietimo nereikia; 'personalized' = su jubiliato vardu ir amžiumi;
--                  'plain' = be vardų ir amžiaus.
-- invitation_lang: 'lt' arba 'ru'.
-- celebrant_name / celebrant_age: naudojami tik 'personalized' atveju.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invitation_type text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS invitation_lang text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS celebrant_name  text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS celebrant_age   integer;
