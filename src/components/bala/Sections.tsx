import Image from "next/image";
import Link from "next/link";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { AUDIENCES, BUSINESS, FEATURED_SLUGS, GAMES, PRICING } from "@/lib/bala-data";
import GameCard from "./GameCard";
import ProcessCarousel from "./ProcessCarousel";
import ReviewsCarousel from "./ReviewsCarousel";
import FaqAccordion from "./FaqAccordion";
import { CheckIcon, ClockIcon, CompassIcon, FacebookIcon, LocationIcon, PhoneIcon, XIcon } from "./icons";

const FIRST_TIME_POINTS = [
  "Jokios VR patirties nereikia",
  "Instruktorius viską paaiškins",
  "Lengva išmokti – valdymas intuityvus",
  "Dauguma klientų VR išbando pirmą kartą",
  "Patogi, saugi erdvė Klaipėdoje",
];

const COMPARE_ROWS: [string, string][] = [
  ["Vienas fizinis kambarys", "Begalė pasaulių"],
  ["Ribota erdvė", "Kosmosas, gelmės, pilys"],
  ["Tik fizinės dekoracijos", "Įspūdingi vaizdai ir efektai"],
  ["Aplinka nekinta", "Skirtingos, interaktyvios aplinkos"],
  ["Sunku pakartoti", "Kaskart nauja istorija"],
];

export function ScenarijaiSection() {
  const featured = FEATURED_SLUGS.map((slug) => GAMES.find((g) => g.slug === slug)!);
  return (
    <section id="scenarijai" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="mb-8">
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(24px,4.4vw,52px)]">
            Top 3 populiariausi scenarijai
          </h2>
        </RevealOnScroll>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 sm:gap-5">
          {featured.map((game) => (
            <GameCard key={game.slug} game={game} priority />
          ))}
        </div>

        <div className="flex justify-center mt-11">
          <Link
            href="/pabegimo-kambariai/kambariai"
            className="inline-flex items-center justify-center rounded-full border-[1.5px] border-white/32 px-[30px] py-4 text-[15px] font-bold text-white transition-[background,border-color,transform] hover:-translate-y-0.5 hover:bg-white/8 hover:border-white/50"
          >
            Visi pabėgimo kambariai
          </Link>
        </div>
      </div>
    </section>
  );
}

export function KaipVykstaSection() {
  return (
    <section id="kaip-vyksta" className="relative overflow-hidden py-14 md:py-20 bg-paper text-paper-ink">
      {/* Dekoratyvi mergina su VR akiniais – įkvepia gyvybės šviesiam blokui */}
      <div className="pointer-events-none absolute inset-y-0 right-0 hidden md:block md:w-[48%] lg:w-[42%] xl:w-[38%]" aria-hidden>
        <Image
          src="/assets/moteris-su-vr-akiniais-klaipedoje.webp"
          alt=""
          fill
          sizes="(min-width: 1280px) 38vw, (min-width: 1024px) 42vw, (min-width: 768px) 48vw, (min-width: 640px) 55vw, 72vw"
          className="object-cover object-top"
          unoptimized
        />
        {/* Sulieja nuotrauką su šviesiu fonu iš kairės ir apačios; galva su VR akiniais lieka matoma */}
        <div className="absolute inset-0 bg-gradient-to-r from-paper via-paper/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-paper via-transparent to-transparent" />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="flex flex-col items-center text-center gap-2.5 mx-auto mb-7 max-w-[560px]">
          <h2 className="font-display uppercase text-paper-ink leading-[1.6] tracking-[-.01em] text-[clamp(24px,4.6vw,52px)]">
            Nuo durų iki kito pasaulio.
          </h2>
          <p className="text-base leading-[1.55] text-paper-ink/66">
            Nuo rezervacijos iki pergalės — maždaug valanda jūsų laiko, iš kurių iki 50 minučių praleisite kitame pasaulyje.
          </p>
        </RevealOnScroll>
      </div>
      {/* Mobile: mergina rodoma atskirai, kad veidas matytųsi aiškiai (be teksto perdengimo) */}
      <div className="relative z-10 mx-auto mb-9 h-[300px] w-[80%] max-w-[320px] overflow-hidden rounded-3xl md:hidden">
        <Image
          src="/assets/moteris-su-vr-akiniais-klaipedoje.webp"
          alt="Mergina su virtualios realybės akiniais Klaipėdoje"
          fill
          sizes="80vw"
          className="object-cover object-top"
          unoptimized
        />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll>
          <ProcessCarousel />
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function KamTinkaSection() {
  return (
    <section id="kam-tinka" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="mb-8 md:mb-10">
          <h2 className="font-display uppercase text-white leading-[1.15] tracking-[-.01em] text-[clamp(24px,4.6vw,52px)]">
            Ieškote idėjos <span className="text-volt">ypatingai progai?</span>
          </h2>
        </RevealOnScroll>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {AUDIENCES.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl border border-line bg-ink-card p-6 md:p-7 transition-transform hover:-translate-y-[5px] hover:border-line-strong"
            >
              <span className="block text-[30px] leading-none mb-4" aria-hidden>{a.emoji}</span>
              <h3 className="text-[17px] font-semibold text-white mb-2">{a.title}</h3>
              <p className="text-sm leading-[1.55] text-smoke">{a.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function KainosSection() {
  return (
    <section id="kainos" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="flex flex-col items-center text-center gap-3 mx-auto mb-8 max-w-[560px]">
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(32px,5.4vw,58px)]">Kainos</h2>
          <p className="text-base leading-[1.65] text-smoke">
            Esant daugiau nei 6 žaidėjams — galima sudaryti 2 komandas (pvz. 4–4), kurios sprendžia užduotis viena šalia kitos.
          </p>
        </RevealOnScroll>
      </div>
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="flex gap-4 overflow-x-auto no-scrollbar pt-1.5 pb-5.5 [justify-content:safe_center]">
          {PRICING.map((p) => (
            <div
              key={p.players}
              className={`flex-none w-[200px] rounded-2xl border-[1.5px] border-volt p-[26px_22px] relative transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-volt-deep hover:shadow-[0_0_0_1px_var(--color-volt),0_16px_34px_-12px_rgba(255,228,0,.5)] ${
                p.popular ? "bg-ink-card-2" : "bg-ink-card"
              }`}
            >
              {p.popular && (
                <span className="absolute -top-3 left-[22px] rounded-full bg-volt text-volt-ink text-[11px] font-extrabold uppercase tracking-wide px-3 py-1.5">
                  Populiariausia
                </span>
              )}
              <p className="text-[13px] font-bold uppercase tracking-wide text-smoke-2 mb-3.5">{p.players}</p>
              <p className="font-display font-normal text-4xl text-white leading-none">
                {p.price}
                <span className="font-body text-sm font-semibold text-smoke-2">{p.unit}</span>
              </p>
              <p className="mt-2 text-[13px] text-smoke">{p.per}</p>
            </div>
          ))}
        </RevealOnScroll>
        <RevealOnScroll className="flex justify-center mt-9">
          <a
            href="#kontaktai"
            className="inline-flex items-center justify-center rounded-full bg-volt px-[34px] py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
          >
            Rezervuoti dabar
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function AtsiliepimaiSection() {
  return (
    <section id="atsiliepimai" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="flex flex-col items-center text-center mb-8">
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(28px,4.8vw,52px)] mb-3">
            Ką sako žaidėjai
          </h2>
          <div className="flex items-center gap-4">
            <span className="font-display font-normal text-[44px] leading-none text-white">4,9</span>
            <div className="text-left">
              <div className="text-volt text-lg tracking-[3px]">★★★★★</div>
              <div className="text-xs uppercase tracking-wide text-smoke-2 font-bold">Google atsiliepimai</div>
            </div>
          </div>
        </RevealOnScroll>
      </div>
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll>
          <ReviewsCarousel />
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function DukSection() {
  return (
    <section id="duk" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="mb-8">
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(22px,4.4vw,52px)]">
            Dažniausiai užduodami klausimai
          </h2>
        </RevealOnScroll>
        <RevealOnScroll>
          <FaqAccordion />
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function FirstTimeSection() {
  return (
    <section className="bg-volt text-volt-ink py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 grid gap-10 md:grid-cols-2 md:items-center">
        <RevealOnScroll>
          <p className="font-display text-xs tracking-[.14em] uppercase text-volt-ink/65 mb-3">Pirmą kartą VR?</p>
          <h2 className="font-display uppercase text-volt-ink leading-[1.6] tracking-[-.01em] text-[clamp(26px,4.6vw,52px)] mb-4">
            Nesijaudink. Mes viskuo pasirūpinsim
          </h2>
          <p className="text-[17px] leading-[1.55] font-medium max-w-[460px] mb-7">
            Nereikia nieko išmanyti apie technologijas. Ateini, užsidedi akinius – ir viskas prasideda savaime.
          </p>
          <a
            href="#kontaktai"
            className="inline-flex items-center justify-center rounded-full bg-ink text-white px-[30px] py-4 text-[15px] font-bold transition-transform hover:-translate-y-0.5 hover:bg-black"
          >
            Rezervuoti dabar
          </a>
        </RevealOnScroll>
        <RevealOnScroll className="flex flex-col gap-3.5">
          {FIRST_TIME_POINTS.map((p) => (
            <div
              key={p}
              className="group flex items-center gap-4 rounded-2xl bg-white/55 hover:bg-ink px-[22px] py-[18px] transition-colors cursor-default"
            >
              <span className="flex-none w-[34px] h-[34px] rounded-full bg-ink text-white group-hover:bg-volt group-hover:text-ink flex items-center justify-center transition-colors">
                <CheckIcon />
              </span>
              <span className="font-display font-normal text-[17px] normal-case text-volt-ink group-hover:text-volt transition-colors">
                {p}
              </span>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function ComparisonSection() {
  return (
    <section className="py-14 md:py-20">
      <div className="mx-auto max-w-[1080px] px-6 md:px-10 min-[1200px]:px-14">
        <RevealOnScroll className="flex flex-col items-center text-center gap-3 mx-auto mb-9 max-w-[640px]">
          <p className="font-display text-xs tracking-[.14em] uppercase text-volt">Palyginimas</p>
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(24px,4.4vw,52px)]">
            Kuo VR pabėgimo kambarys skiriasi nuo tradicinio?
          </h2>
        </RevealOnScroll>
        <RevealOnScroll className="rounded-2xl overflow-hidden border border-line">
          <div className="grid grid-cols-2">
            <div className="px-5 md:px-7 py-4 bg-white/3 font-display text-[11px] md:text-[13px] tracking-wide uppercase text-white/55">
              Tradicinis kambarys
            </div>
            <div className="px-5 md:px-7 py-4 bg-volt font-display text-[13px] md:text-[15px] tracking-wide uppercase text-volt-ink">
              Bala VR
            </div>
          </div>
          {COMPARE_ROWS.map((row) => (
            <div key={row[0]} className="grid grid-cols-2 border-t border-line">
              <div className="px-5 md:px-7 py-4 md:py-5 flex items-center gap-3 bg-white/2">
                <XIcon className="flex-none text-white/35" />
                <span className="text-sm md:text-base text-white/60">{row[0]}</span>
              </div>
              <div className="px-5 md:px-7 py-4 md:py-5 flex items-center gap-3 bg-volt/6">
                <CheckIcon className="flex-none text-volt" />
                <span className="text-sm md:text-base font-semibold text-white">{row[1]}</span>
              </div>
            </div>
          ))}
        </RevealOnScroll>
      </div>
    </section>
  );
}

export function CtaBandSection() {
  return (
    <section className="bg-volt text-volt-ink py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 flex flex-col md:flex-row md:justify-between md:items-center gap-7">
        <div className="md:text-right">
          <h2 className="font-display uppercase text-volt-ink leading-[1.6] text-[clamp(26px,5vw,60px)]">
            Rezervuok savo nuotykį
          </h2>
          <p className="text-base font-semibold max-w-[420px] mt-2 md:ml-auto">Pasirinkite datą ir laiką — likusiu pasirūpinsime mes.</p>
        </div>
        <div className="flex flex-wrap gap-3.5">
          <a
            href="https://bala.lt/"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center rounded-full bg-ink text-white px-[30px] py-4 text-[15px] font-bold transition-transform hover:-translate-y-0.5 hover:bg-black"
          >
            Rezervuoti dabar
          </a>
        </div>
      </div>
    </section>
  );
}

export function KontaktaiSection() {
  return (
    <section id="kontaktai" className="py-14 md:py-20">
      <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 grid gap-10 md:grid-cols-2 md:items-center">
        <RevealOnScroll>
          <h2 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(30px,5.2vw,56px)] mb-6">
            Klaipėdos mieste
          </h2>
          <div>
            {[
              {
                icon: PhoneIcon,
                label: "Telefonas",
                value: (
                  <a href={BUSINESS.phoneHref} className="text-volt hover:underline" aria-label={`Skambinti Bala VR telefonu ${BUSINESS.phoneDisplay}`}>
                    {BUSINESS.phoneDisplay}
                  </a>
                ),
              },
              {
                icon: LocationIcon,
                label: "Adresas",
                value: (
                  <>
                    Pajūrio g. 5B, Klaipėda
                    <br />
                    Prekybos centro 2 aukštas
                  </>
                ),
              },
              {
                icon: ClockIcon,
                label: "Darbo laikas",
                value: <>Išankstinė rezervacija</>,
              },
              {
                icon: CompassIcon,
                label: "Rezervacija",
                value: (
                  <a href="https://bala.lt/" target="_blank" rel="noreferrer" className="text-volt hover:underline">
                    bala.lt
                  </a>
                ),
              },
              {
                icon: FacebookIcon,
                label: "Socialiniai",
                value: (
                  <a href="https://www.facebook.com/BalaVRzaidimai/" target="_blank" rel="noreferrer" className="text-volt hover:underline">
                    Facebook · Bala VR
                  </a>
                ),
              },
            ].map((row, i, arr) => (
              <div key={row.label} className={`flex gap-4 py-4.5 border-t border-line ${i === arr.length - 1 ? "border-b" : ""}`}>
                <row.icon className="text-volt flex-none mt-0.5" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-smoke-2 font-bold mb-1">{row.label}</div>
                  <div className="text-[15.5px] text-white leading-[1.5] font-semibold">{row.value}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-3 flex-wrap mt-8">
            <a
              href="https://bala.lt/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-volt px-[30px] py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
            >
              Rezervuoti dabar
            </a>
          </div>
        </RevealOnScroll>
        <RevealOnScroll className="relative aspect-4/3 rounded-[20px] overflow-hidden border border-line">
          <iframe
            title="Bala VR vieta žemėlapyje — Pajūrio g. 5B, Klaipėda"
            src="https://maps.google.com/maps?q=Paj%C5%ABrio%20g.%205B,%20Klaip%C4%97da&t=&z=15&ie=UTF8&iwloc=&output=embed"
            className="absolute inset-0 w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
          <a
            href="https://www.google.com/maps/search/?api=1&query=Paj%C5%ABrio%20g.%205B%2C%20Klaip%C4%97da"
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-3 right-3 z-2 inline-flex items-center gap-1.5 rounded-full bg-ink/85 backdrop-blur-sm px-3.5 py-2 text-xs font-bold text-white border border-line-strong hover:bg-ink transition-colors"
          >
            <LocationIcon className="w-4 h-4 text-volt" />
            Atidaryti Google Maps
          </a>
        </RevealOnScroll>
      </div>
    </section>
  );
}
