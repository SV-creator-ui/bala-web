import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BUSINESS } from "@/lib/bala-data";
import GamesGallery from "@/components/GamesGallery";

export const metadata: Metadata = {
  title: "VR veiksmo žaidimai Klaipėdoje — BALA VR",
  description:
    "VR veiksmo žaidimai be pabėgimo scenarijaus: 3 žaidimai (~45 min.) nuo €50 ir arkadiniai žaidimai nuo €8. BALA VR Klaipėdoje.",
};

const ACCENT = "#34d1e0";

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden className="mt-0.5 flex-none">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

// VR komandinių žaidimų kainos
const VR_ROWS = [
  { label: "2 žaidėjai", price: "€50" },
  { label: "3 žaidėjai", price: "€60" },
  { label: "Kiekvienas papildomas žaidėjas", price: "+€20" },
];

export default function LaisvasZaidimasPage() {
  return (
    <main className="min-h-[100svh] flex flex-col bg-ink text-white">
      {/* Header */}
      <header className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pt-7 pb-2 flex items-center justify-between gap-4">
        <Link href="/" aria-label="BALA VR — pasirinkti pramogą" className="flex flex-col items-center justify-center">
          <Image src="/assets/logo-bala-vr-wordmark.png" alt="BALA VR" width={220} height={40} className="h-[24px] w-auto" priority />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
            Virtualios realybės erdvė
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-smoke hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Kitos pramogos
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pt-8 md:pt-12 pb-4 text-center">
        <h1 className="font-display uppercase leading-[1.03] tracking-[-.01em] text-[clamp(30px,6vw,58px)] animate-hero-in">
          VR veiksmo <span style={{ color: ACCENT }}>žaidimai</span>
        </h1>
        <p className="mt-4 mx-auto max-w-[640px] text-[17px] md:text-[19px] leading-[1.6] text-white animate-hero-in [animation-delay:70ms]">
          Ateik tiesiog pažaisti. Rinkis linksmus ir aktyvius, 3 skirtingus
          VR veiksmo žaidimus. Jokių galvosūkių! Tik veiksmas!
        </p>
      </section>

      {/* Kainos */}
      <section className="mx-auto w-full max-w-[1080px] px-6 md:px-10 py-8 md:py-12">
        <div className="grid gap-5 md:gap-6 md:grid-cols-2">
          {/* VR veiksmo žaidimai */}
          <div className="rounded-3xl border-[1.5px] border-line bg-ink-card p-7 md:p-9 flex flex-col animate-hero-in-scale [animation-delay:140ms]">
            <h2 className="font-display uppercase text-white text-[clamp(22px,3.4vw,30px)] leading-[1.1]">
              VR veiksmo žaidimai
            </h2>
            <p className="mt-2 text-[16px] md:text-[18px] leading-[1.6] text-white">
              3 skirtingi VR žaidimai, apie 45 min. bendro žaidimo laiko.
            </p>

            <ul className="mt-6 flex flex-col gap-3">
              {VR_ROWS.map((r) => (
                <li key={r.label} className="flex items-center justify-between gap-4 border-b border-line pb-3 last:border-0">
                  <span className="flex items-start gap-2.5 text-[16px] md:text-[17px] text-white">
                    <Check />
                    {r.label}
                  </span>
                  <span className="font-display text-2xl text-white leading-none">{r.price}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/komandiniai-vr-zaidimai/rezervacija"
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full font-bold text-[16px] px-7 py-4 text-[#04252b] transition-transform duration-150 ease-[cubic-bezier(.16,.84,.32,1)] hover:-translate-y-0.5 active:scale-[0.97]"
              style={{ background: "linear-gradient(180deg, #5be6dc 0%, #34d1e0 100%)" }}
            >
              Rezervuoti
              <Arrow />
            </Link>
          </div>

          {/* Arkadiniai žaidimai */}
          <div className="rounded-3xl border-[1.5px] border-line bg-ink-card p-7 md:p-9 flex flex-col animate-hero-in-scale [animation-delay:210ms]">
            <h2 className="font-display uppercase text-white text-[clamp(22px,3.4vw,30px)] leading-[1.1]">
              Arkadiniai žaidimai
            </h2>
            <p className="mt-2 text-[16px] md:text-[18px] leading-[1.6] text-white">
              Stalo futbolas, vairavimo simuliatorius, oro ritulys, reakcijos žaidimas ir Mortal Combat - pramogos po VR žaidimų.
            </p>

            <div className="mt-6 flex items-end gap-2">
              <span className="font-display text-5xl text-white leading-none">€8</span>
              <span className="pb-1 text-[16px] text-white/85">/ 15 min. · 1 žmogus</span>
            </div>

            <ul className="mt-6 flex flex-col gap-3">
              <li className="flex items-start gap-2.5 text-[16px] md:text-[17px] text-white">
                <Check />
                Tinka nuo 5 metų
              </li>
            </ul>

            <a
              href={BUSINESS.phoneHref}
              className="mt-auto pt-7 inline-flex items-center justify-center gap-2 rounded-full border border-line-strong font-bold text-[16px] px-7 py-4 text-white transition-[color,border-color,transform] duration-150 ease-[cubic-bezier(.16,.84,.32,1)] hover:border-[#34d1e0] hover:text-[#34d1e0] active:scale-[0.97]"
            >
              Skambinti {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* Žaidimų galerija */}
      <GamesGallery />

      {/* Footer */}
      <footer className="mt-auto border-t border-line">
        <div className="mx-auto max-w-[1080px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-smoke-2">
          <span>© {new Date().getFullYear()} BALA VR · Pajūrio g. 5B, Klaipėda</span>
          <div className="flex items-center gap-4">
            <a href="/taisykles" className="font-semibold text-smoke hover:text-white transition-colors">
              Taisyklės
            </a>
            <a href={BUSINESS.phoneHref} className="font-semibold text-smoke hover:text-white transition-colors">
              {BUSINESS.phoneDisplay}
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
