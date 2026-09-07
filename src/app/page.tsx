import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BALA VR Klaipėda — pasirinkite savo pramogą",
  description:
    "BALA VR Klaipėdoje: azartiški VR pabėgimo kambariai, aktyvūs VR veiksmo žaidimai arba privati gimtadienio šventė su vaišėmis.",
};

function Arrow() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden className={`mt-0.5 flex-none ${className ?? ""}`}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Features({ items, color }: { items: string[]; color: string }) {
  return (
    <ul className="mt-4 flex flex-col gap-2">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-[13.5px] md:text-[14.5px] leading-[1.35] text-white font-medium">
          <Check className={color} />
          {f}
        </li>
      ))}
    </ul>
  );
}

export default function ChooserPage() {
  return (
    <main className="min-h-[100svh] flex flex-col bg-ink text-white">
      {/* Header */}
      <header className="flex flex-col items-center text-center px-6 pt-8 pb-4 md:pt-10 md:pb-7">
        <Image
          src="/assets/logo-bala-vr-wordmark.png"
          alt="BALA VR"
          width={264}
          height={48}
          className="h-[26px] md:h-[32px] w-auto"
          priority
        />
        <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.24em] leading-none text-volt animate-hero-in">
          220 m² · Klaipėda · Pajūrio g. 5B
        </span>
        <h1 className="mt-6 md:mt-4 font-display uppercase leading-[1.02] tracking-[-.01em] text-[clamp(28px,4.8vw,48px)] animate-hero-in [animation-delay:80ms]">
          Rinkitės savo <span className="text-volt">nuotykį</span>
        </h1>
        <p className="mt-3 max-w-[640px] text-[14px] md:text-[16px] leading-[1.45] text-white/85 animate-hero-in [animation-delay:160ms]">
          Privati virtualios realybės erdvė — gimtadieniams, draugams ir komandoms.
        </p>
        <div className="mt-2 h-2 md:mt-4 md:h-[24px]" aria-hidden />
      </header>

      {/* Three choices */}
      <div className="flex-1 mx-auto w-full max-w-[1320px] px-6 md:px-10 pb-8 md:pb-10">
        <div className="grid gap-4 min-[900px]:gap-6 grid-cols-1 min-[900px]:grid-cols-3 items-stretch min-[900px]:pt-6 min-[900px]:pb-4">
          {/* VR pabėgimo kambariai */}
          <Link
            href="/pabegimo-kambariai"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(255,228,0,0.5)] hover:border-volt transition-all duration-300 ease-[cubic-bezier(.16,.84,.32,1)] active:scale-[0.98] md:min-h-0 animate-hero-in-scale [animation-fill-mode:backwards] min-[900px]:translate-y-3 min-[900px]:-rotate-[0.7deg] hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_20px_40px_-15px_rgba(255,228,0,0.35)]"
          >
            <div className="absolute inset-0 animate-ken-a will-change-transform motion-reduce:animate-none">
              <Image
                src="/assets/hero-drakonu-bokstas.jpg"
                alt="VR pabėgimo kambariai Klaipėdoje"
                fill
                sizes="(min-width:768px) 440px, 100vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50 md:via-ink/72 md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <p className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-volt">
                Draugams · nuo 14 m.
              </p>
              <h2 className="mt-2 font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                Pabėgimo kambarys
              </h2>
              <p className="mt-3 text-[15px] md:text-[16px] leading-[1.4] text-white/95 font-medium">
                50 min. galvosūkių ir azarto. Išgelbėkite save ir draugus.
              </p>
              <Features
                color="text-volt"
                items={[
                  "9 skirtingi kambariai",
                  "2–6 žaidėjai",
                ]}
              />
              <span className="mt-6 md:mt-auto inline-flex items-center gap-2 rounded-full bg-volt text-volt-ink font-bold text-[15px] px-6 py-3.5 self-start transition-transform group-hover:-translate-y-0.5 [text-shadow:none]">
                Rinktis
                <Arrow />
              </span>
            </div>
          </Link>

          {/* Gimtadienių paketai — featured */}
          <Link
            href="/gimtadieniai"
            className="group relative flex flex-col overflow-hidden rounded-3xl border-2 border-[rgba(240,165,0,0.55)] hover:border-[#f0a500] transition-all duration-300 ease-[cubic-bezier(.16,.84,.32,1)] active:scale-[0.98] md:min-h-0 bg-[#0d2b35] animate-hero-in-scale [animation-delay:70ms] [animation-fill-mode:backwards] min-[900px]:-translate-y-2 min-[900px]:scale-[1.03] hover:-translate-y-3 hover:shadow-[0_28px_50px_-15px_rgba(240,165,0,0.5)] z-10"
          >
            <div className="absolute inset-0 animate-ken-c will-change-transform motion-reduce:animate-none">
              <Image
                src="/tortas.png"
                alt="Gimtadienio tortas — BALA VR"
                fill
                sizes="(min-width:768px) 440px, 100vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50 md:via-ink/72 md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-[#f0a500]">
                  Privati šventė · nuo 7 m.
                </p>
                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-[0.14em] text-[#0d2b35] shadow-[0_2px_8px_rgba(0,0,0,0.3)] [text-shadow:none]" style={{ background: "linear-gradient(180deg, #ffbf33 0%, #f0a500 100%)" }}>
                  Populiariausia
                </span>
              </div>
              <h2 className="mt-2 font-display uppercase text-white whitespace-nowrap text-[clamp(22px,2.5vw,30px)] leading-[1.06]">
                Gimtadienių paketai
              </h2>
              <p className="mt-3 text-[15px] md:text-[16px] leading-[1.4] text-white/95 font-medium">
                Visa 220 m² erdvė tik jūsų kompanijai. VR, arkados ir vieta tortui.
              </p>
              <Features
                color="text-[#f0a500]"
                items={[
                  "Iki 16 žaidėjų",
                  "Vieta vaišėms",
                ]}
              />
              <span
                className="mt-6 inline-flex items-center gap-2 rounded-full text-[#0d2b35] font-bold text-[15px] px-6 py-3.5 self-start transition-transform group-hover:-translate-y-0.5 [text-shadow:none]"
                style={{ background: "linear-gradient(180deg, #ffbf33 0%, #f0a500 100%)" }}
              >
                Rinktis
                <Arrow />
              </span>
            </div>
          </Link>

          {/* VR veiksmo žaidimai */}
          <Link
            href="/komandiniai-vr-zaidimai"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(52,209,224,0.32)] hover:border-[#34d1e0] transition-all duration-300 ease-[cubic-bezier(.16,.84,.32,1)] active:scale-[0.98] md:min-h-0 bg-[#07242a] animate-hero-in-scale [animation-delay:140ms] [animation-fill-mode:backwards] min-[900px]:translate-y-4 min-[900px]:rotate-[0.7deg] hover:-translate-y-1 hover:rotate-0 hover:shadow-[0_20px_40px_-15px_rgba(52,209,224,0.35)]"
          >
            <div className="absolute inset-0 animate-ken-b will-change-transform motion-reduce:animate-none">
              <Image
                src="/assets/moteris-su-vr-akiniais-klaipedoje.webp"
                alt="VR veiksmo žaidimai Klaipėdoje"
                fill
                sizes="(min-width:768px) 440px, 100vw"
                className="object-cover object-[50%_38%] transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/50 md:via-ink/72 md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <p className="text-[11px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-[#34d1e0]">
                Kompanijai · nuo 7 m.
              </p>
              <h2 className="mt-2 font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                VR veiksmo žaidimai
              </h2>
              <p className="mt-3 text-[15px] md:text-[16px] leading-[1.4] text-white/95 font-medium">
                3 žaidimai per 45 min. Zombiai, kovos, magija, burgerių kepimas.
              </p>
              <Features
                color="text-[#34d1e0]"
                items={[
                  "Iki 6 žaidėjų",
                  "Komandinis režimas",
                ]}
              />
              <span
                className="mt-6 inline-flex items-center gap-2 rounded-full text-[#04252b] font-bold text-[15px] px-6 py-3.5 self-start transition-transform group-hover:-translate-y-0.5 [text-shadow:none]"
                style={{ background: "linear-gradient(180deg, #5be6dc 0%, #34d1e0 100%)" }}
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
