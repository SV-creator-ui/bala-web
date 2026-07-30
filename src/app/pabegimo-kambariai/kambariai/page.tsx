import type { Metadata } from "next";
import Link from "next/link";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import GameCard from "@/components/bala/GameCard";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import { GAMES } from "@/lib/bala-data";
import { CtaBandSection } from "@/components/bala/Sections";

export const metadata: Metadata = {
  title: "Visi VR pabėgimo kambariai — Bala VR Klaipėda",
  description:
    "Visi 9 Bala VR pabėgimo kambariai Klaipėdoje — nuo drakonų pilies iki nevaldomo traukinio. Iki 45 min., 2–6 žaidėjai, bet kokio patyrimo lygio.",
};

export default function KambariaiPage() {
  return (
    <>
      <Nav />
      <main>
        <header className="relative pt-[150px] pb-14 overflow-hidden bg-[radial-gradient(120%_70%_at_100%_0%,rgba(255,228,0,.08),transparent_60%)] bg-ink">
          <div className="mx-auto max-w-[1320px] px-6 md:px-8">
            <Link
              href="/pabegimo-kambariai"
              className="inline-flex items-center gap-2 text-smoke hover:text-white text-sm font-semibold mb-6 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Atgal į pradžią
            </Link>
            <h1 className="font-display uppercase text-white text-[clamp(26px,6vw,72px)] leading-[1.6] tracking-[-.01em]">
              9 pasauliai. <span className="text-volt">Kurį pasirinksi?</span>
            </h1>
            <p className="text-[clamp(16px,2vw,19px)] leading-[1.65] text-smoke max-w-[600px] mt-5">
              Nuo drakonų pilies iki nevaldomo traukinio — kiekvienas scenarijus turi savą trukmę ir nuotaiką. Rinkitės pagal temą, galvosūkių sudėtingumą ir veiksmo intensyvumą. 2–6 žaidėjams, jokios VR patirties nereikia — tinka nuo pradedančiųjų iki ekspertų.
            </p>
          </div>
        </header>

        <section className="py-16 md:py-24">
          <div className="mx-auto max-w-[1320px] px-6 md:px-8">
            <RevealOnScroll className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {GAMES.map((game, i) => (
                <GameCard key={game.slug} game={game} priority={i < 3} />
              ))}
            </RevealOnScroll>
          </div>
        </section>

        <CtaBandSection />
      </main>
      <Footer />
    </>
  );
}
