import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BUSINESS } from "@/lib/bala-data";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Rezervacija — Komandiniai VR žaidimai | BALA VR Klaipėda",
  description:
    "Rezervuok komandinių VR žaidimų laiką BALA VR Klaipėdoje. Pasirink laiką, žaidėjų skaičių ir sumokėk avansą internetu.",
};

// Komandinių žaidimų puslapio akcentas (žydras). Perrašom Tailwind „volt" temos
// kintamuosius šioje šakoje — taip visas BookingFlow persidažo be atskiro kodo.
const CYAN_THEME = {
  "--color-volt": "#34d1e0",
  "--color-volt-deep": "#26c0d0",
  "--color-volt-ink": "#04252b",
  "--btn-glow": "rgba(52,209,224,.35)",
} as CSSProperties;

export default function Page() {
  return (
    <div className="min-h-[100svh] flex flex-col bg-ink text-white" style={CYAN_THEME}>
      <header className="mx-auto w-full max-w-[1100px] px-6 md:px-10 pt-7 pb-2 flex items-center justify-between gap-4">
        <Link href="/" aria-label="BALA VR — pasirinkti pramogą" className="flex flex-col items-center justify-center">
          <Image src="/assets/logo-bala-vr-wordmark.png" alt="BALA VR" width={220} height={40} className="h-[24px] w-auto" priority />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
            Virtualios realybės erdvė
          </span>
        </Link>
        <Link
          href="/komandiniai-vr-zaidimai"
          className="inline-flex items-center gap-2 text-sm font-semibold text-smoke hover:text-white transition-colors"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Atgal
        </Link>
      </header>

      <main className="mx-auto w-full max-w-[1100px] px-6 md:px-10 pt-10 md:pt-14 pb-12 md:pb-16">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl uppercase">
            Rezervacija
          </h1>
        </header>
        <BookingFlow initialType="game" />
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-smoke-2">
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
    </div>
  );
}
