import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "BALA VR Klaipėda — pasirinkite savo pramogą",
  description:
    "BALA VR Klaipėdoje: azartiški VR pabėgimo kambariai, aktyvūs komandiniai žaidimai arba privati gimtadienio šventė su vaišėmis.",
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
        <li key={f} className="flex items-start gap-2.5 text-[13.5px] md:text-[14.5px] leading-[1.35] text-white/90">
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
      <header className="flex flex-col items-center text-center px-6 pt-8 pb-3 md:pt-10 md:pb-6">
        <Image
          src="/assets/logo-bala-vr-wordmark.png"
          alt="BALA VR"
          width={264}
          height={48}
          className="h-[26px] md:h-[32px] w-auto"
          priority
        />
        <span className="mt-2 text-[11px] font-bold uppercase tracking-[0.2em] leading-none text-white">
          Virtualios realybės erdvė
        </span>
        <h1 className="mt-9 md:mt-5 font-display uppercase leading-[1.02] tracking-[-.01em] text-[clamp(26px,4.4vw,44px)]">
          Pasirinkite savo <span className="text-volt">pramogą</span>
        </h1>
        <div className="mt-2 h-2 md:mt-3 md:h-[50px]" aria-hidden />
      </header>

      {/* Three choices */}
      <div className="flex-1 mx-auto w-full max-w-[1320px] px-6 md:px-10 pb-8 md:pb-10">
        <div className="grid gap-4 min-[900px]:gap-5 grid-cols-1 min-[900px]:grid-cols-3 items-stretch">
          {/* VR pabėgimo kambariai */}
          <Link
            href="/pabegimo-kambariai"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-line hover:border-volt transition-colors md:min-h-0"
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
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_1px_12px_rgba(0,0,0,0.65)]">
              <h2 className="font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                Pabėgimo kambarys
              </h2>
              <p className="mt-1.5 text-[13px] md:text-[14px] font-semibold uppercase tracking-wide text-volt">
                Draugams, šeimoms ir kolektyvams
              </p>
              <p className="mt-3 text-[13.5px] md:text-[14.5px] leading-[1.55] text-white/85">
                Vienas iki 50 min. pabėgimo kambarys, kuriame laukia galvosūkiai,
                azartas ir ribotas laikas išgelbėti save ir draugus. Puikus
                pasirinkimas žaidėjams nuo 14 metų.
              </p>
              <Features
                color="text-volt"
                items={[
                  "Pasirinkimui net 9 pabėgimo kambariai",
                  "Be vaišių zonos",
                ]}
              />
              <span className="mt-6 md:mt-auto inline-flex items-center gap-2 rounded-full bg-volt text-volt-ink font-bold text-[15px] px-6 py-3.5 self-start transition-transform group-hover:-translate-y-0.5 [text-shadow:none]">
                Rinktis
                <Arrow />
              </span>
            </div>
          </Link>

          {/* Gimtadienių paketai */}
          <Link
            href="/gimtadieniai"
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(77,184,204,0.3)] hover:border-[#f0a500] transition-colors md:min-h-0 bg-[#0d2b35]"
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
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_1px_12px_rgba(0,0,0,0.65)]">
              <h2 className="font-display uppercase text-white whitespace-nowrap text-[clamp(22px,2.5vw,30px)] leading-[1.06]">
                Gimtadienių paketai
              </h2>
              <p className="mt-1.5 text-[13px] md:text-[14px] font-semibold uppercase tracking-wide text-[#f0a500]">
                Privati šventė tik jūsų kompanijai
              </p>
              <p className="mt-3 text-[13.5px] md:text-[14.5px] leading-[1.55] text-white/85">
                Ilgesnė šventė su VR žaidimais, arkadinėmis pramogomis ir atskira vieta
                vaišėms. Visa 220 m² erdvė skirta tik jūsų grupei.
              </p>
              <Features
                color="text-[#f0a500]"
                items={[
                  "Privati erdvė",
                  "Vieta vaišėms ir tortui",
                  "VR ir arkadiniai žaidimai",
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
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(52,209,224,0.32)] hover:border-[#34d1e0] transition-colors md:min-h-0 bg-[#07242a]"
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
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_1px_12px_rgba(0,0,0,0.65)]">
              <h2 className="font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                VR veiksmo žaidimai
              </h2>
              <p className="mt-1.5 text-[13px] md:text-[14px] font-semibold uppercase tracking-wide text-[#34d1e0]">
                Žaidėjams nuo 7 metų ir suaugusiems
              </p>
              <p className="mt-3 text-[13.5px] md:text-[14.5px] leading-[1.55] text-white/85">
                Trys komandiniai žaidimai per maždaug 45 minutes. Zombiai, kovos 3x3,
                burgerių kepimas, magijos žaidimai ir kiti linksmi nuotykiai. Nuo 7 m.
              </p>
              <Features
                color="text-[#34d1e0]"
                items={[
                  "3 skirtingi žaidimai",
                  "Apie 45 minutes",
                  "Be vaišių zonos",
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
