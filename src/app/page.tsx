import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BALA VR Klaipėda — pasirink pramogą",
  description:
    "BALA VR Klaipėdoje: VR pabėgimo kambariai ir vaikų gimtadieniai. Pasirink savo nuotykį.",
};

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function ChooserPage() {
  return (
    <main className="min-h-screen flex flex-col bg-ink text-white">
      {/* Header */}
      <header className="flex flex-col items-center text-center px-6 pt-14 pb-8 md:pt-20 md:pb-10">
        <Image
          src="/assets/logo-bala-vr.png"
          alt="BALA VR"
          width={190}
          height={57}
          className="h-[52px] md:h-[60px] w-auto"
          priority
        />
        <h1 className="mt-8 font-display uppercase leading-[1.02] tracking-[-.01em] text-[clamp(30px,6vw,60px)]">
          Pasirink savo <span className="text-volt">pramogą</span>
        </h1>
        <p className="mt-4 max-w-[560px] text-[15.5px] md:text-lg leading-[1.6] text-smoke-2">
          Virtualios realybės nuotykiai Klaipėdoje — pabėgimo kambariai suaugusiems
          ir komandoms, arba nepamirštami vaikų gimtadieniai.
        </p>
      </header>

      {/* Two choices */}
      <div className="flex-1 mx-auto w-full max-w-[1180px] px-6 md:px-10 pb-14">
        <div className="grid gap-5 md:gap-6 md:grid-cols-2 h-full">
          {/* VR pabėgimo kambariai */}
          <Link
            href="/pabegimo-kambariai"
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-line hover:border-volt transition-colors min-h-[58vh] md:min-h-[64vh]"
          >
            <Image
              src="/assets/hero-bala-vr-poster.jpg"
              alt="VR pabėgimo kambariai Klaipėdoje"
              fill
              sizes="(min-width:768px) 560px, 100vw"
              className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/20" />
            <div className="relative p-7 md:p-9">
              <span className="inline-block rounded-full bg-volt/15 text-volt text-xs font-bold uppercase tracking-wide px-3 py-1.5">
                9 scenarijai · 2–10 žaidėjų
              </span>
              <h2 className="mt-4 font-display uppercase text-white text-[clamp(26px,4vw,40px)] leading-[1.05]">
                VR pabėgimo kambariai
              </h2>
              <p className="mt-2 max-w-[420px] text-[14.5px] leading-[1.55] text-smoke">
                Iki 50 min. viename iš 9 virtualių pasaulių. Galvosūkiai, komandinis
                veiksmas ir adrenalinas.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-volt text-volt-ink font-bold text-[15px] px-6 py-3.5 transition-transform group-hover:-translate-y-0.5">
                Rinktis
                <Arrow />
              </span>
            </div>
          </Link>

          {/* Vaikų gimtadieniai */}
          <Link
            href="/gimtadieniai"
            className="group relative flex flex-col justify-end overflow-hidden rounded-3xl border border-[rgba(77,184,204,0.3)] hover:border-[#f0a500] transition-colors min-h-[58vh] md:min-h-[64vh] bg-[#0d2b35]"
          >
            {/* Brand gradient + cake */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(120% 90% at 70% 0%, #16495a 0%, #0d2b35 45%, #0a222a 100%)",
              }}
            />
            <Image
              src="/tortas.png"
              alt=""
              width={340}
              height={340}
              className="pointer-events-none absolute right-2 top-6 md:right-4 md:top-8 w-[clamp(150px,32%,260px)] h-auto opacity-90 drop-shadow-[0_16px_40px_rgba(0,0,0,0.45)] transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-2"
            />
            <div className="relative p-7 md:p-9">
              <span className="inline-block rounded-full bg-[rgba(240,165,0,0.14)] text-[#f0a500] text-xs font-bold uppercase tracking-wide px-3 py-1.5">
                220 m² · iki 23 vaikų
              </span>
              <h2 className="mt-4 font-display uppercase text-white text-[clamp(26px,4vw,40px)] leading-[1.05]">
                Vaikų gimtadieniai
              </h2>
              <p className="mt-2 max-w-[420px] text-[14.5px] leading-[1.55] text-white/70">
                Privati VR erdvė vaikų šventei. Vaikai žaidžia ir tyrinėja virtualius
                pasaulius, tėvai ramiai ilsisi.
              </p>
              <span
                className="mt-5 inline-flex items-center gap-2 rounded-full text-[#0d2b35] font-bold text-[15px] px-6 py-3.5 transition-transform group-hover:-translate-y-0.5"
                style={{ background: "linear-gradient(180deg, #ffbf33 0%, #f0a500 100%)" }}
              >
                Rinktis
                <Arrow />
              </span>
            </div>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1180px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-smoke-2">
          <span>© {new Date().getFullYear()} BALA VR · Pajūrio g. 5B, Klaipėda</span>
          <a href="tel:+37068426686" className="font-semibold text-smoke hover:text-white transition-colors">
            +370 684 26686
          </a>
        </div>
      </footer>
    </main>
  );
}
