import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import BreadcrumbJsonLd from "@/components/bala/BreadcrumbJsonLd";
import GroupInquiryForm from "./GroupInquiryForm";

type Offer = { title: string; text: string };

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none text-volt">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

const STEPS = [
  "Užpildote trumpą užklausą arba paskambinate",
  "Susisiekiame ir pasiūlome programą bei kainą",
  "Suderiname datą ir rezervuojame laiką",
];

/** Bendras įmonių ir mokyklų puslapių karkasas: antraštė, pasiūlymai, žingsniai, forma. */
export default function GroupLanding({
  kind,
  path,
  crumb,
  title,
  lead,
  image,
  imageAlt,
  offersTitle,
  offers,
  points,
  formTitle,
}: {
  kind: "imone" | "mokykla";
  path: string;
  crumb: string;
  title: ReactNode;
  lead: string;
  image: string;
  imageAlt: string;
  offersTitle: string;
  offers: Offer[];
  points: string[];
  formTitle: string;
}) {
  return (
    <main className="min-h-[100svh] flex flex-col bg-ink text-white">
      <BreadcrumbJsonLd
        items={[
          { name: "Pradžia", url: "https://bala.lt" },
          { name: crumb, url: `https://bala.lt${path}` },
        ]}
      />
      <header className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pt-7 pb-2 flex items-center justify-between gap-4">
        <Link href="/" aria-label="BALA VR — pasirinkti pramogą" className="flex flex-col items-center justify-center">
          <Image src="/assets/logo-bala-vr-wordmark.png" alt="BALA VR" width={220} height={40} className="h-[24px] w-auto" priority />
          <span className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
            Virtualios realybės erdvė
          </span>
        </Link>
        <Link href="/" className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-smoke hover:text-white transition-colors">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Kitos pramogos
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pt-8 md:pt-12 grid gap-8 min-[900px]:grid-cols-[1.1fr_1fr] min-[900px]:items-center">
        <div>
          <h1 className="font-display uppercase leading-[1.03] tracking-[-.01em] text-[clamp(30px,5.4vw,54px)] animate-hero-in">
            {title}
          </h1>
          <p className="mt-4 max-w-[560px] text-[17px] md:text-[18px] leading-[1.6] text-smoke animate-hero-in [animation-delay:70ms]">
            {lead}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3 animate-hero-in [animation-delay:140ms]">
            <a
              href="#uzklausa"
              className="inline-flex items-center justify-center rounded-full bg-volt px-7 py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
            >
              {kind === "imone" ? "Gauti pasiūlymą" : "Siųsti užklausą"}
            </a>
            <a
              href="tel:+37068426686"
              className="inline-flex items-center justify-center rounded-full border-[1.5px] border-white/32 px-6 py-4 text-[15px] font-bold text-white transition-colors hover:bg-white/8 hover:border-white/50"
            >
              +370 684 26686
            </a>
          </div>
        </div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-white/10">
          <Image src={image} alt={imageAlt} fill sizes="(min-width:900px) 480px, 100vw" className="object-cover" priority />
        </div>
      </section>

      {/* Pasiūlymai */}
      <section className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pt-14 md:pt-20">
        <h2 className="font-display uppercase text-[clamp(24px,3.6vw,36px)] leading-[1.08]">{offersTitle}</h2>
        <div className={`mt-6 grid gap-4 grid-cols-1 ${offers.length === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          {offers.map((o) => (
            <div key={o.title} className="rounded-2xl border border-line-strong bg-ink-card p-5 md:p-6">
              <h3 className="font-display uppercase text-[20px] leading-[1.15] text-white">{o.title}</h3>
              <p className="mt-2 text-[15.5px] leading-[1.55] text-smoke">{o.text}</p>
            </div>
          ))}
        </div>
        <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
          {points.map((p) => (
            <li key={p} className="flex items-start gap-2.5 text-[15.5px] leading-[1.45] text-white">
              <Check />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Žingsniai + forma */}
      <section id="uzklausa" className="mx-auto w-full max-w-[1080px] px-6 md:px-10 py-14 md:py-20 scroll-mt-6 grid gap-8 min-[900px]:grid-cols-[1fr_1.35fr]">
        <div>
          <h2 className="font-display uppercase text-[clamp(24px,3.6vw,36px)] leading-[1.08]">{formTitle}</h2>
          <ol className="mt-6 flex flex-col gap-4">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-start gap-3.5">
                <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-volt text-[15px] font-bold text-volt-ink">
                  {i + 1}
                </span>
                <span className="pt-1 text-[16px] leading-[1.5] text-smoke">{s}</span>
              </li>
            ))}
          </ol>
          <p className="mt-8 text-[15px] leading-[1.6] text-smoke-2">
            BALA VR · Pajūrio g. 5B, Klaipėda (prekybos centro 2 aukštas)
          </p>
        </div>
        <GroupInquiryForm kind={kind} />
      </section>

      <footer className="border-t border-line mt-auto">
        <div className="mx-auto max-w-[1080px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-smoke-2">
          <span>© {new Date().getFullYear()} BALA VR · Pajūrio g. 5B, Klaipėda</span>
          <a href="tel:+37068426686" className="font-semibold text-smoke hover:text-white transition-colors">
            +370 684 26686
          </a>
        </div>
      </footer>
    </main>
  );
}
