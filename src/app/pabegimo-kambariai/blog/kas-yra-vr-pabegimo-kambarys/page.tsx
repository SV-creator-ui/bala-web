import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/bala-data";

const COVER = "/assets/vr-pabegimo-kambarys-bala-vr-klaipedoje.jpg";
const SLUG = "/pabegimo-kambariai/blog/kas-yra-vr-pabegimo-kambarys";

export const metadata: Metadata = {
  title: "Kas yra VR pabėgimo kambarys? Išsamus gidas | Bala VR",
  description:
    "Kas yra VR pabėgimo kambarys ir kaip jis veikia? Paaiškiname technologiją, laisvą judėjimą ir kuo jis skiriasi nuo įprasto pabėgimo kambario.",
  alternates: { canonical: SLUG },
  openGraph: {
    title: "Kas yra VR pabėgimo kambarys?",
    description:
      "Virtualios realybės pabėgimo kambarys – klasikinio pabėgimo kambario idėja be fizinių ribų. Kaip jis veikia ir kodėl taip įtraukia?",
    type: "article",
    images: [`${BUSINESS.url}${COVER}`],
  },
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "BlogPosting",
  headline: "Kas yra VR pabėgimo kambarys?",
  description:
    "Kas yra VR pabėgimo kambarys ir kaip jis veikia? Paaiškiname technologiją, laisvą judėjimą ir kuo jis skiriasi nuo įprasto pabėgimo kambario.",
  image: `${BUSINESS.url}${COVER}`,
  inLanguage: "lt",
  datePublished: "2026-07-05",
  dateModified: "2026-07-05",
  mainEntityOfPage: `${BUSINESS.url}${SLUG}`,
  author: { "@type": "Organization", name: BUSINESS.name, url: BUSINESS.url },
  publisher: {
    "@type": "Organization",
    name: BUSINESS.name,
    logo: { "@type": "ImageObject", url: `${BUSINESS.url}/assets/logo-bala-vr.png` },
  },
};

export default function BlogPost() {
  return (
    <div className="bg-ink text-white min-h-screen font-body">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />

      <div className="sticky top-0 z-50 bg-ink border-b-2 border-volt flex items-center justify-between px-7 py-3.5">
        <Link href="/pabegimo-kambariai" className="inline-flex items-baseline gap-1.5 no-underline">
          <b className="font-display text-2xl text-white tracking-[-.02em] normal-case">BALA</b>
          <span className="font-display text-2xl text-volt tracking-[-.02em] normal-case">VR</span>
        </Link>
        <nav className="flex items-center gap-5">
          <Link href="/pabegimo-kambariai/blog" className="hidden sm:inline text-xs font-bold uppercase tracking-wide text-white hover:text-volt transition-colors">
            Blogas
          </Link>
          <Link href="/pabegimo-kambariai/kambariai" className="hidden sm:inline text-xs font-bold uppercase tracking-wide text-white hover:text-volt transition-colors">
            Kambariai
          </Link>
          <Link href="/rezervacija" className="inline-flex items-center rounded-md bg-volt px-5 py-3 text-xs font-extrabold uppercase tracking-wide text-black hover:brightness-105 transition">
            Rezervuoti dabar
          </Link>
        </nav>
      </div>

      <div className="max-w-[820px] mx-auto px-7">
        <header className="pt-12">
          <Link href="/pabegimo-kambariai/blog" className="inline-flex items-center gap-2 text-smoke hover:text-white text-sm font-semibold mb-6 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Visi straipsniai
          </Link>
          <span className="block text-xs font-bold uppercase tracking-[.14em] text-volt">VR blogas · Gidas</span>
          <h1 className="font-display uppercase text-[clamp(34px,5.4vw,60px)] leading-[1.05] tracking-[-.01em] mt-3.5 mb-4">
            Kas yra VR pabėgimo kambarys?
          </h1>
          <div className="flex flex-wrap gap-2 items-center text-[13px] text-white/70">
            <span>Bala VR komanda</span>
            <span className="text-white/30">·</span>
            <span>~5 min skaitymo</span>
            <span className="text-white/30">·</span>
            <span>Virtualios realybės pabėgimo kambariai</span>
          </div>
        </header>

        <div className="mt-8 mb-2 rounded-xl overflow-hidden border-[3px] border-volt relative h-[260px] md:h-[420px]">
          <Image
            src={COVER}
            alt="VR pabėgimo kambarys – vaizdas pro narvo grotas į miestą virtualios realybės žaidime „Bala VR“ Klaipėdoje"
            fill
            className="object-cover object-center"
            priority
            sizes="(max-width: 820px) 100vw, 820px"
          />
        </div>

        <article className="pt-10 pb-2">
          <p className="text-xl leading-[1.6] text-white mb-5 font-medium">
            Įsivaizduokite pabėgimo kambarį, kuriame sienos gali išnykti. Vieną akimirką stovite senoviniame drakonų bokšte, kitą – skęstančioje povandeninėje stotyje, o po kelių minučių bandote sustabdyti nevaldomą traukinį ar ištrūkti iš paslaptingo dvaro. Čia nereikia keisti dekoracijų ar statyti naujų kambarių – užtenka užsidėti virtualios realybės akinius.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Būtent tai ir yra <strong className="text-white font-bold">VR pabėgimo kambarys</strong> – klasikinio pabėgimo kambario idėja, sujungta su virtualia realybe, kur vienintelė riba yra vaizduotė.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Jei kada nors ieškojote, <strong className="text-white font-bold">ką veikti Klaipėdoje</strong> su draugais, šeima ar kolegomis, tačiau įprasti pabėgimo kambariai jau atrodo pažįstami, šis gidas padės suprasti, kaip veikia virtualios realybės pabėgimo kambariai ir kodėl jie tampa viena populiariausių komandinių pramogų.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5 scroll-mt-24">
            VR pabėgimo kambarys – paprastai
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Virtualios realybės pabėgimo kambarys – tai komandinis žaidimas, kuriame užsidėję VR akinius akimirksniu persikeliate į kitą pasaulį. Kartu su komanda sprendžiate galvosūkius, ieškote užuominų, atliekate įvairias užduotis ir bandote įvykdyti misiją iki laiko pabaigos.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Didžiausias skirtumas nuo įprasto pabėgimo kambario – visa aplinka yra virtuali. Nėra fizinių spynų, dekoracijų ar sienų, kurios ribotų scenarijų. Todėl vieną dieną galite tyrinėti senovinę šventyklą, kitą – gelbėti pasaulį kosminėje stotyje, o dar kitą – ieškoti kelio iš drakonų pilies.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            Kuo VR pabėgimo kambarys skiriasi nuo įprasto?
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Nors pagrindinis principas išlieka tas pats – komanda, galvosūkiai ir ribotas laikas – pati patirtis yra visiškai kitokia.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            <strong className="text-white font-bold">Neribota aplinka.</strong> Įprastą pabėgimo kambarį riboja fizinės sienos ir dekoracijos. Virtualios realybės pasaulyje galite keliauti per skirtingas lokacijas, aplankyti neįmanomas vietas ir patirti tai, ko realybėje tiesiog neįmanoma sukurti.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            <strong className="text-white font-bold">Gyvi, interaktyvūs galvosūkiai.</strong> Objektus galite paimti į rankas, pasukti, sujungti, aktyvuoti mechanizmus ar bendradarbiauti su komandos nariais. Visa aplinka reaguoja į jūsų veiksmus realiuoju laiku.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            <strong className="text-white font-bold">Daugiau įtampos ir emocijų.</strong> VR leidžia sukurti situacijas, kurių neįmanoma perteikti tradiciniame pabėgimo kambaryje. Kai kuriuose scenarijuose jus gali persekioti drakonai, pulti rykliai, iš tamsos artėti monstrai ar virš galvos pradėti kristi meteoritai. Tačiau svarbiausia ne efektai. Jie sukuria įtampą, kuri priverčia komandą veikti greičiau, daugiau bendrauti ir kartu ieškoti sprendimų. Būtent todėl daugelis žaidėjų sako, kad jautėsi ne lyg žaidime, o lyg veiksmo filme, kuriame pagrindiniai herojai buvo jie patys.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            <strong className="text-white font-bold">Naujas nuotykis kiekvieną kartą.</strong> Įveikėte vieną scenarijų ir norisi kažko naujo? Kitą kartą galite pasirinkti visiškai kitą istoriją – neišeidami iš tos pačios žaidimų erdvės.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Trumpai tariant, įprastas pabėgimo kambarys yra vienas fizinis kambarys, o VR pabėgimo kambarys – daugybė skirtingų pasaulių vienoje vietoje.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            Kodėl VR pabėgimo kambariai taip įtraukia?
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Vien galvosūkių neužtenka. Kai už jūsų nugaros pasigirsta drakono riaumojimas, paskutinėmis sekundėmis tenka sustabdyti katastrofą ar išvengti pavojų, įsijungia azartas.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Komanda pradeda kalbėti garsiau, greičiau priima sprendimus, dalijasi idėjomis ir kartu ieško išeities. Būtent todėl virtualios realybės pabėgimo kambariai sukelia tiek emocijų. Čia svarbu ne tik išspręsti užduotis, bet ir išgyventi istoriją. Kiekvienas scenarijus tampa nuotykiu, kurio baigtis priklauso nuo jūsų komandos.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            Kaip tai veikia? Technologija be jokių laidų
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Šiuolaikiniai VR pabėgimo kambariai naudoja <strong className="text-white font-bold">laisvo judėjimo (Free-Roam)</strong> technologiją. Tai reiškia, kad jūs nevaldote personažo pulteliu ir nesėdite vietoje. Jūs patys vaikštote po tikrą kambarį, o kiekvienas jūsų žingsnis tiksliai atkuriamas virtualiame pasaulyje.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Svarbiausia – visi žaidėjai yra toje pačioje realioje erdvėje ir mato vieni kitus. <strong className="text-white font-bold">Atstumai virtualiame pasaulyje sutampa su realiais</strong>: jei komandos narys stovi per žingsnį nuo jūsų žaidime, lygiai taip pat jis stovi ir realiame kambaryje. Todėl galite drąsiai vaikščioti vieni šalia kitų, paduoti daiktą į rankas ar net paploti per delną – nesusidursite ir nesugriūsite vieni ant kitų. Būtent to dažniausiai ir klausia žaidėjai prieš atvykdami.
          </p>
          <ul className="flex flex-col gap-2.5 mb-5">
            <li className="flex gap-3 text-[16px] leading-[1.6] text-white/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-1 text-volt">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong className="text-white font-bold">Belaidžiai VR akiniai.</strong> Jokių laidų – galite laisvai judėti ir dairytis 360°.</span>
            </li>
            <li className="flex gap-3 text-[16px] leading-[1.6] text-white/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-1 text-volt">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong className="text-white font-bold">Tikslus judesių sekimas.</strong> Speciali sistema realiu laiku seka jūsų ir kitų komandos narių padėtį, todėl atstumai tarp žaidėjų virtualioje erdvėje išlieka tikslūs.</span>
            </li>
            <li className="flex gap-3 text-[16px] leading-[1.6] text-white/70">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" className="flex-none mt-1 text-volt">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span><strong className="text-white font-bold">Matote savo komandą.</strong> Vaikštote po tą patį kambarį ir žaidime matote vieni kitus tose pačiose vietose kaip realybėje – galite kalbėtis, rodyti kryptį, perduoti daiktus ir kartu spręsti užduotis.</span>
            </li>
          </ul>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Rezultatas – po kelių minučių smegenys pradeda tikėti tuo, ką mato akys, o jūs pasijuntate tarsi kitame pasaulyje.
          </p>

          <h2 className="font-display uppercase text-[clamp(24px,3vw,34px)] leading-[1.1] text-white mt-11 mb-3.5">
            Kur išbandyti VR pabėgimo kambarį Klaipėdoje?
          </h2>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Geriausias būdas suprasti, kas yra VR pabėgimo kambarys – tiesiog jį išbandyti. <strong className="text-white font-bold">„Bala VR“</strong> Klaipėdoje (Pajūrio g. 5B) rasite 9 laisvo judėjimo scenarijus komandai nuo 2 iki 6 žaidėjų – nuo šeimai draugiškų iki įtemptų nuotykių.
          </p>
          <p className="text-[17px] leading-[1.75] text-white/70 mb-5">
            Peržiūrėkite <Link href="/pabegimo-kambariai/kambariai" className="text-volt hover:underline font-semibold">visus VR pabėgimo kambarius</Link>, susipažinkite su <Link href="/pabegimo-kambariai#kainos" className="text-volt hover:underline font-semibold">kainomis</Link>, pažiūrėkite, <Link href="/pabegimo-kambariai#kaip-vyksta" className="text-volt hover:underline font-semibold">kaip viskas vyksta</Link>, o jei kyla klausimų – atsakymus rasite <Link href="/pabegimo-kambariai#duk" className="text-volt hover:underline font-semibold">D.U.K. skiltyje</Link>.
          </p>

          <div className="flex flex-wrap gap-2 mt-8">
            {["VR pabėgimo kambarys", "Virtualios realybės pabėgimo kambariai", "Pramogos Klaipėdoje", "Free-Roam VR", "Komandinės pramogos"].map((t) => (
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
            Surink 2–6 žaidėjų komandą ir išsirink scenarijų – „Bala VR“ Klaipėdoje.
          </p>
          <Link href="/rezervacija" className="inline-flex items-center rounded-md bg-black text-white px-7 py-4 text-[13px] font-extrabold uppercase tracking-wide hover:opacity-90 transition">
            Rezervuoti dabar
          </Link>
        </div>
      </div>

      <footer className="border-t border-line mt-14 py-10 px-7">
        <div className="max-w-[1100px] mx-auto flex flex-wrap items-center justify-between gap-5 text-[13px] text-white/70">
          <span>© {new Date().getFullYear()} Bala VR · Pajūrio g. 5B, Klaipėda</span>
          <Link href="/pabegimo-kambariai/blog" className="text-volt font-semibold hover:underline">
            ← Visi straipsniai
          </Link>
        </div>
      </footer>
    </div>
  );
}
