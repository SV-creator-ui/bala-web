# BALA rezervacijų sistema — paleidimo gidas (Fazė 1 / MVP)

Ši sistema leidžia klientams rezervuoti VR pabėgimo kambario laiką ir sumokėti
**30 € avansą** internetu per Montonio. Puslapis: **`/rezervacija`**.

## Ką reikia padaryti vieną kartą

### 1. Įdiegti priklausomybes
```bash
cd bala-web
npm install
```
(Įdiegia `@supabase/supabase-js` ir `jose`.)

### 2. Susikurti Supabase projektą (nemokama)
1. Eik į https://supabase.com → **New project**.
2. Kai sukurtas: **SQL Editor → New query** → įklijuok failo
   [`supabase/schema.sql`](supabase/schema.sql) turinį → **Run**. (Sukuria lenteles.)
3. **Project Settings → API** → nusikopijuok:
   - **Project URL** → į `SUPABASE_URL`
   - **service_role** raktą (ne anon!) → į `SUPABASE_SERVICE_ROLE_KEY`

### 3. Susikurti Montonio paskyrą
1. Registruokis: https://montonio.com (verslui). Pateik įmonės duomenis (KYC).
2. **Partner System → Settings → API keys** → nusikopijuok:
   - **Access Key** → į `MONTONIO_ACCESS_KEY`
   - **Secret Key** → į `MONTONIO_SECRET_KEY`
3. Testavimui palik `MONTONIO_ENV=sandbox`. Kai viskas veiks — keisk į `production`.

### 4. Sukurti `.env.local`
Nukopijuok `.env.local.example` → `.env.local` ir įrašyk reikšmes iš 2 ir 3 žingsnių.
```bash
cp .env.local.example .env.local
```

### 5. Paleisti
```bash
npm run dev
```
Atsidaryk http://localhost:3000/rezervacija

## Kaip veikia mokėjimas
1. Klientas pasirenka laiką, žaidėjus, kontaktus → spaudžia „Sumokėti 30 €".
2. Serveris sukuria `pending` rezervaciją ir Montonio užsakymą, nukreipia į banką.
3. Sumokėjus Montonio praneša `/api/montonio/webhook` → rezervacija tampa `paid`.
4. Klientas grįžta į `/rezervacija/patvirtinta` → mato bilietą.

> **Webhook lokaliai:** Montonio negali pasiekti `localhost`. Testuok arba
> įkėlus į Vercel (su `NEXT_PUBLIC_SITE_URL=https://...`), arba per tunelį
> (pvz. `ngrok`), kad `notificationUrl` būtų viešai pasiekiamas.

## Ką galima keisti be programuotojo
Failas [`src/lib/booking/config.ts`](src/lib/booking/config.ts):
- darbo valandos (`openHour`, `closeHour`), seansų intervalas (`slotStepMin`);
- avansas (`depositEur`), žaidėjų ribos (`minPlayers`/`maxPlayers`);
- kiek grupių vienu metu (`slotCapacity`);
- papildomos paslaugos (`ADDONS` — kol kas tuščia).

Kainos: [`src/lib/booking/pricing.ts`](src/lib/booking/pricing.ts)
(2 asm.=50 €, 3 asm.=65 €, 4–10 asm.=20 €/asm.).

## Admin skydelis (Fazė 2) — `/admin`
Rezervacijų valdymas: sąrašas, filtrai, būsenų keitimas (apmokėta / atšaukta),
seansų blokavimas (remontas, privatūs renginiai).

- **DEMO režimas:** kol nėra Supabase, `/admin` rodo pavyzdinius duomenis.
  Prisijungimo slaptažodis: `demo`.
- **Tikras režimas:** nustatykite `ADMIN_PASSWORD` aplinkos kintamąjį + Supabase.
  Tada prisijungimui naudojamas jūsų slaptažodis, o duomenys — realūs.
- **Sauga:** jei Supabase yra, bet `ADMIN_PASSWORD` nenustatytas, `/admin` bus
  užrakinta (kad realūs duomenys neliktų su numatytu slaptažodžiu).

## Kas dar bus (kitos fazės)
- **Fazė 3:** automatiniai el. laiškai (patvirtinimas, priminimas).
- **Fazė 4:** nuolaidų kodai, kelios kalbos, statistika.
