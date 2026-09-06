import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privatumo politika — BALA VR Klaipėda",
  description:
    "BALA VR privatumo politika: kokius asmens duomenis renkame rezervuojant, kaip juos naudojame ir saugome, mokėjimų tvarkymas per Paysera bei jūsų teisės pagal BDAR.",
};

type Section = {
  n: number;
  emoji: string;
  title: string;
  body?: string[];
  items?: string[];
};

const UPDATED = "2026-09-04";

const SECTIONS: Section[] = [
  {
    n: 1,
    emoji: "🏢",
    title: "Duomenų valdytojas",
    body: [
      "Jūsų asmens duomenų valdytojas yra **Šarūnas Valius**, veikiantis pagal individualios veiklos vykdymo pažymą **Nr. 1379347** (toliau — „BALA VR“, „mes“).",
    ],
    items: [
      "Adresas: **Pajūrio g. 5B, Klaipėda**",
      "El. paštas: **bala.pramogos@gmail.com**",
      "Telefonas: **+370 684 26686**",
    ],
  },
  {
    n: 2,
    emoji: "📋",
    title: "Kokius duomenis renkame",
    body: [
      "Rezervuojant paslaugą arba perkant dovanų kuponą tvarkome tik tuos duomenis, kuriuos pateikiate patys:",
    ],
    items: [
      "**Vardas** (ir, jei nurodote, švenčiančiojo vardas bei amžius).",
      "**Telefono numeris** ir **el. pašto adresas** — susisiekti ir patvirtinti rezervaciją.",
      "**Rezervacijos duomenys:** data, laikas, paslaugos tipas, dalyvių skaičius, pastabos.",
      "**Mokėjimo duomenys** — tvarkomi mokėjimų paslaugų teikėjo Paysera; kortelės duomenų mes nematome ir nesaugome (žr. 4 punktą).",
    ],
  },
  {
    n: 3,
    emoji: "🎯",
    title: "Tikslai ir teisinis pagrindas",
    body: [
      "Duomenis tvarkome remdamiesi Bendruoju duomenų apsaugos reglamentu (BDAR):",
    ],
    items: [
      "**Rezervacijos ir paslaugos vykdymas** — teisinis pagrindas: sutarties sudarymas ir vykdymas (BDAR 6 str. 1 d. b p.).",
      "**Apskaita ir teisinių prievolių vykdymas** — teisinis pagrindas: teisinė prievolė (BDAR 6 str. 1 d. c p.).",
      "**Susisiekimas dėl užklausų ar rezervacijos pakeitimų** — teisinis pagrindas: teisėtas interesas (BDAR 6 str. 1 d. f p.).",
    ],
  },
  {
    n: 4,
    emoji: "💳",
    title: "Mokėjimai (Paysera)",
    body: [
      "Atsiskaitymai internetu vykdomi per mokėjimų platformą **Paysera** (UAB „EVP International“). Perėję prie apmokėjimo, esate nukreipiami į saugią Paysera aplinką.",
      "**Mokėjimo kortelės ar banko prisijungimo duomenų mes negauname ir nesaugome** — juos tvarko tik Paysera pagal savo privatumo politiką. Mes gauname tik informaciją apie mokėjimo būseną (apmokėta / neapmokėta) ir užsakymo numerį.",
    ],
  },
  {
    n: 5,
    emoji: "🤝",
    title: "Kam perduodame duomenis",
    body: [
      "Jūsų duomenų neparduodame. Juos gali tvarkyti tik patikimi paslaugų teikėjai (duomenų tvarkytojai), kiek to reikia paslaugai suteikti:",
    ],
    items: [
      "**Paysera** (UAB „EVP International“) — mokėjimų vykdymas.",
      "**Supabase** — rezervacijų duomenų bazės saugojimas.",
      "**Vercel** — svetainės priegloba (hostingas).",
      "**Google** — patvirtinimo laiškų siuntimas ir rezervacijų kalendorius.",
      "Duomenys taip pat gali būti pateikti kompetentingoms institucijoms, kai to reikalauja teisės aktai.",
    ],
  },
  {
    n: 6,
    emoji: "⏳",
    title: "Kiek laiko saugome",
    body: [
      "Rezervacijų ir susisiekimo duomenis saugome tiek, kiek reikia paslaugai suteikti ir galimiems ginčams spręsti. Su apskaita ir mokėjimais susiję duomenys saugomi teisės aktų nustatytą laikotarpį (buhalterinės apskaitos dokumentai — įprastai iki 10 metų). Pasibaigus terminui, duomenys saugiai sunaikinami arba nuasmeninami.",
    ],
  },
  {
    n: 7,
    emoji: "🍪",
    title: "Slapukai",
    body: [
      "Svetainė naudoja tik būtinuosius techninius slapukus, reikalingus jos veikimui (pvz. rezervacijos ir sesijos palaikymui). Rinkodaros ar sekimo slapukų be jūsų sutikimo nenaudojame. Slapukus galite valdyti ar ištrinti savo naršyklės nustatymuose.",
    ],
  },
  {
    n: 8,
    emoji: "⚖️",
    title: "Jūsų teisės",
    body: ["Pagal BDAR jūs turite teisę:"],
    items: [
      "**Susipažinti** su savo duomenimis ir gauti jų kopiją.",
      "**Ištaisyti** netikslius ar papildyti neišsamius duomenis.",
      "**Ištrinti** duomenis (teisė būti pamirštam), kai nėra teisinio pagrindo juos toliau saugoti.",
      "**Apriboti** tvarkymą arba **nesutikti** su tvarkymu teisėto intereso pagrindu.",
      "**Perkelti** duomenis kitam valdytojui.",
    ],
  },
  {
    n: 9,
    emoji: "📨",
    title: "Kaip įgyvendinti teises ir kur skųstis",
    body: [
      "Dėl bet kurios teisės kreipkitės el. paštu **bala.pramogos@gmail.com** — atsakysime per teisės aktų nustatytą terminą.",
      "Jei manote, kad jūsų duomenys tvarkomi netinkamai, turite teisę pateikti skundą **Valstybinei duomenų apsaugos inspekcijai** (L. Sapiegos g. 17, Vilnius, ada@ada.lt, vdai.lrv.lt).",
    ],
  },
  {
    n: 10,
    emoji: "🔄",
    title: "Politikos pakeitimai",
    body: [
      "Šią privatumo politiką galime atnaujinti. Aktuali versija visada skelbiama šiame puslapyje, nurodant paskutinio atnaujinimo datą.",
    ],
  },
];

// Paryškiname **žvaigždutėmis** pažymėtas teksto vietas.
function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i} className="font-bold text-white">
            {p.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{p}</span>
        )
      )}
    </>
  );
}

export default function PrivatumoPolitikaPage() {
  return (
    <main className="min-h-[100svh] flex flex-col bg-ink text-white">
      {/* Viršutinė juosta */}
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-[900px] items-center justify-between px-6 py-4 md:px-10">
          <Link href="/" aria-label="BALA VR — pradžia" className="inline-flex">
            <Image
              src="/assets/logo-bala-vr-wordmark.png"
              alt="BALA VR"
              width={220}
              height={40}
              className="h-[22px] w-auto"
              priority
            />
          </Link>
          <Link
            href="/"
            className="text-[13px] font-semibold text-smoke transition-colors hover:text-white"
          >
            ← Į pradžią
          </Link>
        </div>
      </header>

      {/* Turinys */}
      <div className="mx-auto w-full max-w-[900px] flex-1 px-6 pb-16 pt-10 md:px-10 md:pt-14">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-volt">
          Virtualios realybės erdvė
        </p>
        <h1 className="mt-3 font-display uppercase leading-[1.02] tracking-[-.01em] text-[clamp(30px,6vw,52px)]">
          Privatumo <span className="text-volt">politika</span>
        </h1>
        <p className="mt-4 max-w-[640px] text-[15px] leading-[1.6] text-smoke">
          Gerbiame jūsų privatumą. Šioje politikoje paaiškiname, kokius asmens
          duomenis renkame rezervuojant paslaugas, kaip juos naudojame, saugome
          ir kokias teises turite.
        </p>
        <p className="mt-2 text-[12px] text-smoke-2">
          Paskutinį kartą atnaujinta: {UPDATED}
        </p>

        <div className="mt-10 flex flex-col gap-4">
          {SECTIONS.map((s) => (
            <section
              key={s.n}
              className="rounded-2xl border border-line bg-ink-soft/60 p-5 md:p-6"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-volt text-[14px] font-bold text-volt-ink"
                  aria-hidden
                >
                  {s.n}
                </span>
                <h2 className="font-display text-[18px] uppercase leading-[1.1] tracking-wide text-white">
                  <span className="mr-1.5" aria-hidden>
                    {s.emoji}
                  </span>
                  {s.title}
                </h2>
              </div>

              {s.body?.map((p, i) => (
                <p
                  key={i}
                  className="mt-4 text-[14px] leading-[1.6] text-smoke"
                >
                  <RichText text={p} />
                </p>
              ))}

              {s.items && (
                <ul className="mt-4 flex flex-col gap-2.5">
                  {s.items.map((it, i) => (
                    <li
                      key={i}
                      className="flex gap-2.5 text-[14px] leading-[1.5] text-smoke"
                    >
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-volt/70" aria-hidden />
                      <span>
                        <RichText text={it} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <p className="mt-10 text-[13px] leading-[1.6] text-smoke-2">
          Kilus klausimų dėl asmens duomenų tvarkymo, rašykite{" "}
          <a href="mailto:bala.pramogos@gmail.com" className="font-semibold text-smoke underline hover:text-white">
            bala.pramogos@gmail.com
          </a>
          . Taip pat žr. mūsų{" "}
          <Link href="/taisykles" className="font-semibold text-smoke underline hover:text-white">
            taisykles
          </Link>
          .
        </p>
      </div>

      {/* Footeris */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-smoke-2 sm:flex-row md:px-10">
          <span>© {new Date().getFullYear()} BALA VR · Šarūnas Valius, ind. veiklos pažyma Nr. 1379347</span>
          <a
            href="tel:+37068426686"
            className="font-semibold text-smoke transition-colors hover:text-white"
          >
            +370 684 26686
          </a>
        </div>
      </footer>
    </main>
  );
}
