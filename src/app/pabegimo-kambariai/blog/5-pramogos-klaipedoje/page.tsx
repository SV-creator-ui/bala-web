import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "5 pramogos Klaipėdoje, kurias verta išbandyti | Bala VR blogas",
  description:
    "Ką veikti Klaipėdoje? 5 geriausios pramogos Klaipėdoje visai komandai: VR pabėgimo kambariai, boulingas, kartingas, laser tag ir jūrų muziejus. Idėjos laisvalaikiui, gimtadieniui ir komandos formavimui.",
  openGraph: {
    title: "5 pramogos Klaipėdoje, kurias verta išbandyti",
    description: "Idėjos laisvalaikiui Klaipėdoje visai komandai – nuo VR pabėgimo kambarių iki boulingo ir jūrų muziejaus.",
    type: "article",
  },
};

const CheckItem = ({ children }: { children: React.ReactNode }) => (
  <li className="flex gap-3 text-[16px] leading-[1.6] text-white/70">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-1 text-volt">
      <polyline points="20 6 9 17 4 12" />
    </svg>
    <span>{children}</span>
  </li>
);

export default function BlogPost() {
  return (
    <div className="bg-ink text-white min-h-screen font-body">
      <div className="sticky top-0 z-50 bg-ink border-b-2 border-volt flex items-center justify-between px-7 py-3.5">
        <Link href="/pabegimo-kambariai" className="inline-flex items-baseline gap-1.5 no-underline">
          <b className="font-display text-2xl text-white tracking-[-.02em] normal-case">BALA</b>
          <span className="font-display text-2xl text-volt tracking-[-.02em] normal-case">VR</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/pabegimo-kambariai" className="hidden sm:inline text-xs font-bold uppercase tracking-wide text-white hover:text-volt transition-colors">
            Pagrindinis
          </Link>
          <Link href="/pabegimo-kambariai#scenarijai" className="hidden sm:inline text-xs font-bold uppercase tracking-wide text-white hover:text-volt transition-colors">
            Scenarijai
          </Link>
          <Link href="/rezervacija" className="inline-flex items-center rounded-md bg-volt px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-black hover:brightness-105 transition">
            Rezervuoti dabar
          </Link>
        </nav>
      </div>

      <div className="max-w-[820px] mx-auto px-7">
        <header className="pt-12">
          <span className="text-xs font-bold uppercase tracking-[.14em] text-volt">VR blogas · Laisvalaikis</span>
          <h1 className="font-display uppercase text-[clamp(34px,5.4vw,60px)] leading-[1.5] tracking-[-.01em] mt-3.5 mb-4">
            5 pramogos Klaipėdoje, kurias verta išbandyti
          </h1>
          <div className="flex flex-wrap gap-2 items-center text-[13px] text-white/70">
            <span>Bala VR komanda</span>
            <span className="text-white/30">·</span>
            <span>~6 min skaitymo</span>
            <span className="text-white/30">·</span>
            <span>Pramogos Klaipėdoje</span>
          </div>
        </header>

        <div className="mt-8 mb-2 rounded-xl overflow-hidden border-[3px] border-volt relative h-[260px] md:h-[420px]">
          <Image
            src="/assets/why-vr.png"
            alt="Draugai pramogauja Klaipėdoje – VR pabėgimo kambariai Bala VR"
            fill
            className="object-cover object-[center_25%]"
            priority
          />
        </div>

        <article className="pt-10 pb-2">
          <p className="text-xl leading-[1.6] text-white mb-5 font-medium">
            Klaipėda – ne tik jūra, kopos ir senamiestis. Uostamiestyje netrūksta vietų, kur galima smagiai praleisti laiką su draugais, šeima ar kolektyvu, nesvarbu, koks oras už lango.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Jei ieškote, <strong className="text-white font-bold">ką veikti Klaipėdoje</strong>, surinkome penkias pramogas, kurios tinka beveik bet kokiai progai – nuo įprasto vakaro su draugais iki gimtadienio ar komandos formavimo šventės. Pradėsime nuo įspūdingiausios, o toliau – klasika, kuri niekada nenuvilia.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5 scroll-mt-24">
            <span className="text-volt">1.</span> VR pabėgimo kambariai „Bala VR“
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Jei norisi pramogos, kuri iš tikrųjų perkelia į kitą pasaulį, <strong className="text-white font-bold">VR pabėgimo kambariai Klaipėdoje</strong> – tai, ko ieškote. „Bala VR“ užsidedate virtualios realybės akinius ir kartu su komanda atsiduriate paslaptingame dvare, piratų laive, povandeninėje stotyje ar senoviniame bokšte, iš kurio reikia kuo greičiau rasti kelią lauk.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Skirtingai nei įprastame pabėgimo kambaryje su spynomis ir raktais, čia aplinka gyva: judate po realią erdvę, dairotės, kalbatės su komanda, ieškote užuominų ir sprendžiate galvosūkius taip, lyg būtumėte pačiame žaidimo pasaulyje.
          </p>

          <div className="bg-ink-card border border-volt/40 rounded-xl p-6 md:p-10 my-6">
            <span className="inline-block bg-volt text-black text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5 rounded mb-4">
              Rekomenduojame
            </span>
            <p className="text-white font-semibold text-lg mb-3.5">Kodėl verta rinktis „Bala VR“?</p>
            <ul className="flex flex-col gap-2.5 mb-5">
              <CheckItem>
                <strong className="text-white font-bold">9 skirtingi scenarijai</strong> – nuo šeimai draugiškų iki įtemptų nuotykių.
              </CheckItem>
              <CheckItem>
                <strong className="text-white font-bold">2–6 žaidėjai</strong> vienoje komandoje, didesniems kolektyvams – kelios grupės.
              </CheckItem>
              <CheckItem>
                <strong className="text-white font-bold">VR patirties nereikia</strong> – instruktorius viską ramiai paaiškina.
              </CheckItem>
              <CheckItem>
                Puikiai tinka <strong className="text-white font-bold">gimtadieniui, pasimatymui ar komandos formavimui</strong>.
              </CheckItem>
            </ul>
            <p className="text-[17px] leading-[1.75] text-white/70">
              Vienas žaidimas trunka apie 45 minutes, o kaina – nuo 20 € žmogui. Rasite mus adresu Pajūrio g. 5B, Klaipėdoje.
            </p>
            <div className="flex gap-3 flex-wrap mt-6">
              <Link href="/rezervacija" className="inline-flex items-center rounded-md bg-volt px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-black hover:brightness-105 transition">
                Rezervuoti dabar
              </Link>
              <Link
                href="/pabegimo-kambariai#scenarijai"
                className="inline-flex items-center rounded-md border-2 border-volt px-6 py-3.5 text-[13px] font-extrabold uppercase tracking-wide text-volt hover:bg-volt/10 transition"
              >
                Peržiūrėti scenarijus
              </Link>
            </div>
          </div>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            <span className="text-volt">2.</span> Boulingas
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Klasika, kuri tinka visiems. <strong className="text-white font-bold">Boulingas</strong> – lengvas būdas smagiai praleisti vakarą, net jei kompanijoje niekas anksčiau nėra žaidęs. Nereikia jokio pasiruošimo: pasirenkate taką, batus – ir varžybos prasideda.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Boulingas puikiai tinka didesnėms grupėms, nes žaidėjų eilė leidžia visiems bendrauti tarp metimų. Dažnai šalia būna baras ar kavinė, todėl vakarą galima pratęsti neišeinant iš pastato. Idealu draugų susitikimui ar neįpareigojančiam gimtadieniui.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            <span className="text-volt">3.</span> Kartingas
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Adrenalino mėgėjams <strong className="text-white font-bold">kartingas</strong> – vienas geriausių pasirinkimų Klaipėdoje. Uždara trasa, greiti kartai ir laiko matavimas paverčia paprastą važiavimą tikromis lenktynėmis, kuriose kiekviena sekundė svarbi.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Tai puiki pramoga kolektyvui ar draugų kompanijai, mėgstančiai varžytis. Dauguma trasų turi apsauginę įrangą ir instruktažą, todėl išbandyti gali ir tie, kas prie vairo sėda pirmą kartą.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            <span className="text-volt">4.</span> Laser tag ir batutų parkai
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            <strong className="text-white font-bold">Laser tag</strong> – aktyvi komandinė pramoga, kurioje reikia strategijos, greičio ir bendradarbiavimo. Žaidžiama tamsioje arenoje su šviesos efektais, o komandos varžosi tarpusavyje realiu laiku.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Jei kompanijoje yra vaikų arba tiesiog norisi judesio, gera alternatyva – <strong className="text-white font-bold">batutų parkas</strong>. Tai smagi veikla šeimoms, gimtadieniams ir visiems, kas nori išlieti energiją ir pasijusti kaip vaikystėje.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            <span className="text-volt">5.</span> Lietuvos jūrų muziejus ir delfinariumas
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Ramesniam laisvalaikiui puikiai tinka <strong className="text-white font-bold">Lietuvos jūrų muziejus</strong> Smiltynėje. Akvariumai, jūros gyvūnai ir delfinų pasirodymai – tai pramoga, kuri patiks tiek vaikams, tiek suaugusiems.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Kelionė keltu per Kuršių marias jau savaime tampa nuotykiu, o pati vieta puikiai dera su pasivaikščiojimu pajūriu. Idealus pasirinkimas šeimos dienai ar svečių, atvykusių į Klaipėdą, programai.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            Kurią pramogą rinktis?
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Viskas priklauso nuo nuotaikos ir kompanijos. Norite ramaus laiko su šeima – rinkitės jūrų muziejų. Ieškote adrenalino – kartingas ar laser tag. O jei norisi patirti kažką, ko realybėje tiesiog neįmanoma, ir kartu su komanda atsidurti visiškai kitame pasaulyje, <strong className="text-white font-bold">VR pabėgimo kambariai „Bala VR“</strong> paliks ryškiausią įspūdį.
          </p>

          <div className="flex flex-wrap gap-2 mt-2">
            {["Pramogos Klaipėdoje", "Ką veikti Klaipėdoje", "VR pabėgimo kambariai", "Gimtadienis", "Komandos formavimas", "Laisvalaikis"].map((t) => (
              <span key={t} className="bg-ink-card border border-line text-white/70 text-xs font-semibold px-3 py-1.5 rounded">
                {t}
              </span>
            ))}
          </div>
        </article>
      </div>

      <div className="max-w-[820px] mx-auto px-7 mt-10">
        <div className="bg-volt text-black rounded-xl p-8 md:p-13 text-center">
          <h3 className="font-display uppercase text-[clamp(24px,3.4vw,40px)] leading-[1.05] mb-3">Ar tavo komandai pavyks pabėgti?</h3>
          <p className="text-base leading-[1.55] text-black/80 max-w-[520px] mx-auto mb-5.5">
            Surink komandą nuo 2 iki 6 žaidėjų ir išbandyk VR pabėgimo kambarį „Bala VR“ Klaipėdoje.
          </p>
          <Link href="/rezervacija" className="inline-flex items-center rounded-md bg-black text-white px-7 py-4 text-[13px] font-extrabold uppercase tracking-wide hover:opacity-90 transition">
            Rezervuoti dabar
          </Link>
        </div>
      </div>

      <footer className="border-t border-line mt-14 py-10 px-7">
        <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-between gap-5 text-[13px] text-white/70">
          <span>© {new Date().getFullYear()} Bala VR · Pajūrio g. 5B, Klaipėda</span>
          <Link href="/pabegimo-kambariai" className="text-volt font-semibold hover:underline">
            Grįžti į pagrindinį puslapį →
          </Link>
        </div>
      </footer>
    </div>
  );
}
