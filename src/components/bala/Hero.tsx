import HeroFX from "./HeroFX";
import HeroVideo from "./HeroVideo";

export default function Hero() {
  return (
    <section
      id="hero"
      className="relative pt-[132px] pb-16 md:pt-[168px] md:pb-[90px] overflow-hidden bg-ink"
    >
      {/* Fono efektų sluoksniai */}
      <HeroFX />

      {/* Fono švytėjimas – suliejimui su puslapiu */}
      <div className="absolute inset-0 z-1 pointer-events-none bg-gradient-to-b from-ink/50 via-transparent to-ink" aria-hidden />

      <div className="relative z-2 mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14">
        <div className="grid items-center gap-10 lg:gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
        <div className="max-w-[640px]">
          <p className="inline-flex items-center gap-2.5 font-display text-xs tracking-[.14em] uppercase text-volt mb-4 animate-hero-in [animation-delay:.05s]">
            <span className="w-[7px] h-[7px] rounded-full bg-volt shadow-[0_0_0_4px_rgba(255,228,0,.18)]" />
            Ar tavo komandai pavyks pabėgti?
          </p>
          <h1 className="font-display uppercase text-white leading-[1.6] tracking-[-.01em] text-[clamp(28px,5.4vw,58px)] mb-3 animate-hero-in [animation-delay:.14s]">
            VR pabėgimo kambarys{" "}
            <span className="text-volt [text-shadow:0_0_38px_rgba(255,228,0,.45)]">Klaipėdoje</span>
          </h1>
          <p className="text-[clamp(17px,2.4vw,23px)] font-semibold leading-[1.35] text-white mb-5 animate-hero-in [animation-delay:.19s]">
            Tai ne žaidimas. <span className="text-volt">Tai nuotykis kitame pasaulyje.</span>
          </p>
          <div className="flex flex-col gap-2 max-w-[520px] mb-4 animate-hero-in [animation-delay:.24s]">
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">Užsidedate VR akinius.</p>
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">
              Po kelių sekundžių atsiduriate drakonų pilyje, povandeninėje šventykloje arba paslaptingame dvare.
            </p>
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">Laikas bėga.</p>
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">Tik jūs.</p>
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">Tik jūsų komanda.</p>
            <p className="text-[clamp(15px,1.4vw,16px)] leading-[1.5] text-smoke">Ar pavyks pabėgti ir išsigelbėti?</p>
          </div>
          <div className="flex flex-wrap gap-3.5 mb-6 animate-hero-in [animation-delay:.34s]">
            <a
              href="#kontaktai"
              className="inline-flex items-center justify-center rounded-full bg-volt px-[30px] py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
            >
              Rezervuoti dabar
            </a>
            <a
              href="/pabegimo-kambariai/kambariai"
              className="inline-flex items-center justify-center rounded-full border-[1.5px] border-white/32 px-[30px] py-4 text-[15px] font-bold text-white transition-[background,border-color,transform] hover:-translate-y-0.5 hover:bg-white/8 hover:border-white/50"
            >
              Peržiūrėti scenarijus
            </a>
          </div>
          <ul className="flex flex-wrap gap-2.5 animate-hero-in [animation-delay:.44s]">
            <li className="flex flex-col gap-0.5 rounded-xl border border-line-strong bg-ink-card/80 backdrop-blur-sm px-4 py-2.5 transition-[border-color,transform] hover:border-volt hover:-translate-y-0.5">
              <span className="text-volt text-[15px] leading-[1.2] tracking-[1px]">★★★★★</span>
              <span className="text-[10.5px] uppercase tracking-wide text-smoke-2 font-bold whitespace-nowrap">4,9 · Google atsiliepimai</span>
            </li>
            {[
              ["300+", "Komandų"],
              ["Iki 50 min", "Nuotykis"],
              ["9", "Scenarijai"],
            ].map(([num, label]) => (
              <li
                key={label}
                className="flex flex-col gap-0.5 rounded-xl border border-line-strong bg-ink-card/80 backdrop-blur-sm px-4 py-2.5 transition-[border-color,transform] hover:border-volt hover:-translate-y-0.5"
              >
                <strong className="font-display text-[19px] leading-[1.2] text-white font-normal">{num}</strong>
                <span className="text-[10.5px] uppercase tracking-wide text-smoke-2 font-bold whitespace-nowrap">{label}</span>
              </li>
            ))}
          </ul>
        </div>

          {/* Dešinė pusė – VR Cave treilerio video */}
          <div className="animate-hero-in-scale [animation-delay:.3s]">
            <HeroVideo />
          </div>
        </div>
      </div>
    </section>
  );
}
