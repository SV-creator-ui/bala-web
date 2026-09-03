import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Taisyklės — BALA VR Klaipėda",
  description:
    "BALA VR žaidimų erdvės taisyklės: sauga, amžiaus reikalavimai, elgesys žaidimų zonoje, apmokėjimas ir atsakomybė. Pajūrio g. 5B, Klaipėda.",
};

type Section = {
  n: number;
  emoji: string;
  title: string;
  items: string[];
};

const SECTIONS: Section[] = [
  {
    n: 1,
    emoji: "👶",
    title: "Amžius",
    items: [
      "**VR pabėgimo kambariai** (reikia mąstyti ir spręsti užduotis): žaisti vieniems — **nuo 14 metų**; su lydinčiu suaugusiuoju — **nuo 8 metų**.",
      "**Komandiniai VR žaidimai** (linksmi ir aktyvūs): žaisti vaikams vieniems — **nuo 7 metų**.",
      "Jaunesni nei 7 m. gali žaisti kitus (ne VR) žaidimus, prižiūrimi suaugusiųjų.",
    ],
  },
  {
    n: 2,
    emoji: "⚠️",
    title: "Sveikata ir saugumas",
    items: [
      "Jei žaidžiant VR pajutote svaigulį ar pykinimą — nedelsdami nusiimkite akinius arba iškelkite ranką ir praneškite instruktoriui.",
      "VR nerekomenduojama nėščiosioms, sergantiems epilepsija, širdies ligomis ar turintiems pusiausvyros sutrikimų.",
      "Dalyvaudami prisiimate atsakomybę už savo sveikatą ir savijautą žaidimo metu.",
    ],
  },
  {
    n: 3,
    emoji: "👪",
    title: "Tėvų ir globėjų vaidmuo",
    items: [
      "Nepilnamečius atlydi ir už jų elgesį bei saugumą atsako suaugęs asmuo.",
      "Tėvai ir lydintys asmenys **neina į VR žaidimų zoną** žaidimo metu.",
      "**Patys nenuiminėkite vaikams VR akinių ir neduokite jiems nurodymų VR žaidimo metu** — su įranga dirba ir vaikus žaidime konsultuoja tik instruktorius.",
    ],
  },
  {
    n: 4,
    emoji: "🧑‍🏫",
    title: "Instruktoriaus nurodymai",
    items: [
      "Laikykitės instruktoriaus nurodymų ir žaidimo instrukcijų.",
      "Su VR akiniais iš žaidimų kambario išeiti negalima.",
      "Instruktorius turi teisę sustabdyti paslaugą lankytojams, **nesilaikantiems taisyklių, nurodymų ar keliantiems pavojų kitiems**.",
    ],
  },
  {
    n: 5,
    emoji: "🕹️",
    title: "Arkadiniai ir stalo žaidimai",
    items: [
      "Žaidimų aparatų **negalima stumdyti, kilnoti ar ant jų lipti**.",
      "Prie kiekvieno žaidimo žaidžiama **po du** (išskyrus stalo futbolą).",
      "**Žaidžiant nenaudokite perteklinės jėgos** — mygtukus reikia spausti, ne daužyti.",
    ],
  },
  {
    n: 6,
    emoji: "🍽️",
    title: "Maistas, gėrimai, alkoholis",
    items: [
      "**Maistą ir gėrimus vartokite tik prie stalo** — ne prie žaidimų automatų, ne vairavimo (lenktynių) kėdėje ir ne VR zonoje. Prieš žaidimą po valgio nusiplaukite rankas.",
      "Į žaidimų erdvę neįleidžiami apsvaigę asmenys ar tie, kurių elgesys kelia pavojų sau ar kitiems.",
    ],
  },
  {
    n: 7,
    emoji: "⏰",
    title: "Laikas ir pratęsimas",
    items: [
      "Pasibaigus užsakytam laikui reikia **išeiti laiku** arba **prasitęsti laiką** papildomai pagal galiojančius įkainius.",
      "Jei pratęsti laiko negalima, pasibaigus laikui pridedame **5 minutes susiruošimui**.",
      "Vėluojant išeiti, papildomas laikas yra apmokestinamas.",
    ],
  },
  {
    n: 8,
    emoji: "💳",
    title: "Apmokėjimas ir atšaukimas",
    items: [
      "Už paslaugas atsiskaitoma iki užsakymo pradžios.",
      "Atšaukus užsakymą, avansas negrąžinamas.",
      "Jei renginys negali vykti dėl techninių ar darbuotojo sveikatos priežasčių, pasiūlysime kitą datą.",
    ],
  },
  {
    n: 9,
    emoji: "⚖️",
    title: "Atsakomybė už įrangą ir daiktus",
    items: [
      "Už dėl neatsargumo sugadintą VR įrangą, žaidimų aparatus ar patalpas atsako užsakovas (užsakymą pateikęs asmuo).",
      "Organizatorius neatsako už asmeninius daiktus, negautą naudą ar kitus tiesioginius ar netiesioginius nuostolius, patirtus naudojantis VR paslaugomis.",
    ],
  },
  {
    n: 10,
    emoji: "🧹",
    title: "Tvarka po apsilankymo",
    items: [
      "Prieš išeidami surinkite ir išmeskite savo šiukšles į šiukšliadėžę, likusius skysčius išpilkite tam skirtoje vietoje.",
      "Palikite stalą ir kėdes tvarkingas, o apie bet kokį įrangos gedimą praneškite instruktoriui.",
    ],
  },
  {
    n: 11,
    emoji: "⚡",
    title: "Techniniai nesklandumai",
    items: [
      "Retkarčiais gali pasitaikyti techninių problemų (pvz., elektros ar interneto sutrikimų). Stengsimės išspręsti jas vietoje, o jei nepavyks — perkelsime jūsų laiką į kitą dieną.",
    ],
  },
  {
    n: 12,
    emoji: "📸",
    title: "Nuotraukos ir vaizdo įrašai",
    items: [
      "Renginio metu darytas nuotraukas ir vaizdo įrašus galime naudoti reklamai ir socialiniuose tinkluose, nebent iš anksto paprašysite to nedaryti.",
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

export default function TaisyklesPage() {
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
          BALA VR <span className="text-volt">taisyklės</span>
        </h1>
        <p className="mt-4 max-w-[640px] text-[15px] leading-[1.6] text-smoke">
          Sveiki atvykę į BALA VR žaidimų areną! Kad apsilankymas būtų smagus ir
          saugus visiems, šių taisyklių <strong className="font-bold text-white">būtina laikytis</strong>.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
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
            </section>
          ))}
        </div>

        <p className="mt-10 text-[13px] leading-[1.6] text-smoke-2">
          Dėkojame, kad laikotės taisyklių — taip apsilankymas lieka saugus ir
          malonus visiems. Kilus klausimų, kreipkitės į instruktorių.
        </p>
      </div>

      {/* Footeris */}
      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-[900px] flex-col items-center justify-between gap-3 px-6 py-6 text-sm text-smoke-2 sm:flex-row md:px-10">
          <span>© {new Date().getFullYear()} BALA VR · Pajūrio g. 5B, Klaipėda</span>
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
