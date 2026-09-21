import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import ChooserReviewsSlider from "@/components/shared/ChooserReviewsSlider";

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
    <ul className="mt-4 flex flex-col gap-2.5 md:gap-2">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2.5 text-[15px] md:text-[14.5px] leading-[1.4] md:leading-[1.35] text-white font-semibold md:font-medium">
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
      <header className="flex flex-col items-center text-center px-6 pt-10 pb-8 md:pt-16 md:pb-12">
        <Image
          src="/assets/logo-bala-vr-wordmark.png"
          alt="BALA VR"
          width={288}
          height={52}
          className="h-[30px] md:h-[38px] w-auto"
          priority
        />
        <span className="mt-4 md:mt-5 whitespace-nowrap text-[11px] md:text-[12px] font-bold uppercase tracking-[0.28em] leading-none text-white/80 animate-hero-in">
          Virtualios realybės erdvė
        </span>
        <h1 className="mt-6 md:mt-8 font-display uppercase leading-[1.02] tracking-[-.01em] text-[clamp(30px,5.2vw,54px)] animate-hero-in [animation-delay:80ms]">
          Rinkitės savo <span className="text-volt">nuotykį</span>
        </h1>
        <p className="mt-4 md:mt-5 max-w-[640px] text-[15px] md:text-[17px] leading-[1.55] text-white/85 animate-hero-in [animation-delay:160ms]">
          Privati virtualios realybės erdvė — gimtadieniams, draugams ir komandoms.
        </p>
        <a
          href="https://share.google/tPHRV6QUCNXzb2KPV"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="147 Google atsiliepimai — 5 iš 5 žvaigždučių"
          className="mt-6 md:mt-7 inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] hover:bg-white/[0.09] hover:border-white/20 px-3.5 py-1.5 animate-hero-in [animation-delay:240ms] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 48 48" aria-hidden className="flex-none">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
          </svg>
          <span className="text-[13px] tracking-[0.02em] text-[#ffd54a]" aria-hidden>
            ★★★★★
          </span>
          <span className="text-[12px] md:text-[13px] font-semibold text-white">
            147
          </span>
          <span className="text-[12px] md:text-[13px] text-white/75">
            Google atsiliepimų
          </span>
        </a>
      </header>

      {/* Three choices */}
      <div className="flex-1 mx-auto w-full max-w-[1320px] px-6 md:px-10 pb-8 md:pb-10">
        <div className="grid gap-4 min-[900px]:gap-6 grid-cols-1 min-[900px]:grid-cols-3 items-stretch min-[900px]:pt-6 min-[900px]:pb-4">
          {/* VR pabėgimo kambariai */}
          <Link
            href="/pabegimo-kambariai"
            className="card-mobile-reveal group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(255,228,0,0.5)] hover:border-volt transition-[transform,border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-premium)] active:scale-[0.98] md:min-h-0 min-[900px]:animate-hero-in-scale min-[900px]:[animation-fill-mode:backwards] max-[899px]:scale-[0.98] min-[900px]:translate-y-3 min-[900px]:-rotate-[0.7deg] hover:-translate-y-1 hover:rotate-0 hover:scale-100 hover:shadow-[0_20px_40px_-15px_rgba(255,228,0,0.35)]"
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
            <div className="absolute inset-0 bg-gradient-to-t from-ink from-[38%] via-ink/88 via-[70%] to-ink/55 md:from-0% md:via-ink/72 md:via-50% md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <p className="text-[12.5px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-volt">
                Draugams · nuo 14 m.
              </p>
              <h2 className="mt-2 font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                Pabėgimo kambarys
              </h2>
              <p className="mt-3 text-[16.5px] md:text-[16px] leading-[1.45] md:leading-[1.4] text-white font-medium">
                50 min. galvosūkių ir azarto. Išgelbėkite save ir draugus.
              </p>
              <Features
                color="text-volt"
                items={[
                  "9 skirtingi kambariai",
                  "2–6 žaidėjai",
                ]}
              />
              <div className="mt-6 md:mt-auto flex items-center gap-3 [text-shadow:none]">
                <span className="inline-flex items-center gap-2 rounded-full bg-volt text-volt-ink font-bold text-[15px] px-6 py-3.5 transition-transform group-hover:-translate-y-0.5">
                  Rinktis
                  <Arrow />
                </span>
                <span className="text-[14px] md:text-[13px] font-semibold text-white/95 md:text-white/80">
                  nuo €20/asm.
                </span>
              </div>
            </div>
          </Link>

          {/* Gimtadienių paketai — featured */}
          <Link
            href="/gimtadieniai"
            className="card-mobile-reveal group relative flex flex-col overflow-hidden rounded-3xl border-2 border-[rgba(240,165,0,0.55)] hover:border-[#f0a500] transition-[transform,border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-premium)] active:scale-[0.98] md:min-h-0 bg-[#0d2b35] min-[900px]:animate-hero-in-scale min-[900px]:[animation-delay:70ms] min-[900px]:[animation-fill-mode:backwards] max-[899px]:scale-[1.01] min-[900px]:-translate-y-2 min-[900px]:scale-[1.03] hover:-translate-y-3 hover:shadow-[0_28px_50px_-15px_rgba(240,165,0,0.5)] z-10"
          >
            <div className="absolute inset-0 animate-ken-c will-change-transform motion-reduce:animate-none">
              <Image
                src="/tortas.webp"
                alt="Gimtadienio tortas — BALA VR"
                fill
                sizes="(min-width:768px) 440px, 100vw"
                className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink from-[38%] via-ink/88 via-[70%] to-ink/55 md:from-0% md:via-ink/72 md:via-50% md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <p className="text-[12.5px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-[#f0a500]">
                Privati šventė · nuo 7 m.
              </p>
              <h2 className="mt-2 font-display uppercase text-white whitespace-nowrap text-[clamp(22px,2.5vw,30px)] leading-[1.06]">
                Gimtadieniai
              </h2>
              <p className="mt-3 text-[16.5px] md:text-[16px] leading-[1.45] md:leading-[1.4] text-white font-medium">
                Visa 220 m² erdvė tik jūsų kompanijai. VR, arkados ir vieta tortui.
              </p>
              <Features
                color="text-[#f0a500]"
                items={[
                  "Iki 16 žaidėjų",
                  "Vieta vaišėms",
                ]}
              />
              <div className="mt-6 flex items-center gap-3 [text-shadow:none]">
                <span
                  className="inline-flex items-center gap-2 rounded-full text-[#0d2b35] font-bold text-[15px] px-6 py-3.5 transition-transform group-hover:-translate-y-0.5 animate-cta-glow motion-reduce:animate-none"
                  style={{ background: "linear-gradient(180deg, #ffbf33 0%, #f0a500 100%)" }}
                >
                  Rinktis
                  <Arrow />
                </span>
                <span className="text-[14px] md:text-[13px] font-semibold text-white/95 md:text-white/85">
                  nuo €219
                </span>
              </div>
            </div>
          </Link>

          {/* VR veiksmo žaidimai */}
          <Link
            href="/komandiniai-vr-zaidimai"
            className="card-mobile-reveal group relative flex flex-col overflow-hidden rounded-3xl border border-[rgba(52,209,224,0.32)] hover:border-[#34d1e0] transition-[transform,border-color,box-shadow] duration-[var(--duration-base)] ease-[var(--ease-out-premium)] active:scale-[0.98] md:min-h-0 bg-[#07242a] min-[900px]:animate-hero-in-scale min-[900px]:[animation-delay:140ms] min-[900px]:[animation-fill-mode:backwards] max-[899px]:scale-[0.98] min-[900px]:translate-y-4 min-[900px]:rotate-[0.7deg] hover:-translate-y-1 hover:rotate-0 hover:scale-100 hover:shadow-[0_20px_40px_-15px_rgba(52,209,224,0.35)]"
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
            <div className="absolute inset-0 bg-gradient-to-t from-ink from-[38%] via-ink/88 via-[70%] to-ink/55 md:from-0% md:via-ink/72 md:via-50% md:to-ink/42" />
            <div className="absolute inset-x-0 top-0 h-2/5 bg-gradient-to-b from-ink/55 to-transparent md:from-ink/25" />
            <div className="relative flex flex-1 flex-col p-5 md:p-7 [text-shadow:0_2px_10px_rgba(0,0,0,0.92)]">
              <p className="text-[12.5px] md:text-[12px] font-bold uppercase tracking-[0.18em] text-[#34d1e0]">
                Kompanijai · nuo 7 m.
              </p>
              <h2 className="mt-2 font-display uppercase text-white text-[clamp(24px,3.1vw,32px)] leading-[1.06]">
                VR veiksmo žaidimai
              </h2>
              <p className="mt-3 text-[16.5px] md:text-[16px] leading-[1.45] md:leading-[1.4] text-white font-medium">
                3 žaidimai per 45 min. Zombiai, kovos, magija, burgerių kepimas.
              </p>
              <Features
                color="text-[#34d1e0]"
                items={[
                  "Iki 10 žaidėjų",
                  "Komandinis režimas",
                ]}
              />
              <div className="mt-6 flex items-center gap-3 [text-shadow:none]">
                <span
                  className="inline-flex items-center gap-2 rounded-full text-[#04252b] font-bold text-[15px] px-6 py-3.5 transition-transform group-hover:-translate-y-0.5"
                  style={{ background: "linear-gradient(180deg, #5be6dc 0%, #34d1e0 100%)" }}
                >
                  Rinktis
                  <Arrow />
                </span>
                <span className="text-[14px] md:text-[13px] font-semibold text-white/95 md:text-white/80">
                  nuo €20/asm.
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Dovanų kuponas — secondary CTA */}
        <div className="mt-6 md:mt-8 flex justify-center">
          <Link
            href="/pabegimo-kambariai/dovanu-kuponas"
            className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-5 py-3 text-[14px] md:text-[14.5px] font-semibold text-smoke transition-colors hover:border-volt/50 hover:bg-white/[0.06] hover:text-white"
          >
            Ieškai dovanos? Padovanok VR nuotykį <span aria-hidden>→</span>
          </Link>
        </div>

        <ChooserReviewsSlider />
      </div>

      {/* About BALA VR Klaipėda */}
      <section className="border-t border-line/60 bg-ink">
        <div className="mx-auto max-w-[820px] px-6 md:px-10 py-12 md:py-16 text-center">
          <h2 className="font-display uppercase leading-[1.05] tracking-[-.01em] text-[clamp(24px,3.6vw,36px)] text-white">
            BALA VR <span className="text-volt">Klaipėdoje</span>
          </h2>
          <p className="mt-5 md:mt-6 text-[16px] md:text-[17px] leading-[1.65] text-white/85">
            Privati 220 m² virtualios realybės erdvė vaikų gimtadieniams, draugų kompanijoms, šeimoms ir kolektyvams. Mūsų erdvėje rasite komandinius VR žaidimus, devynis pabėgimo kambarius, interaktyvią sieną ir arkadines pramogas.
          </p>
        </div>
      </section>

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
