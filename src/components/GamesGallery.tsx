"use client";

import { useEffect, useRef } from "react";

type Game = { video?: string; img?: string; tag: string };

// Žaidimų galerija (tie patys failai kaip gimtadienių puslapyje)
const GAMES: Game[] = [
  { video: "/games/g-cookdup.mp4", tag: "Nuotykis" },
  { video: "/games/g-party-ship.mp4", tag: "Veiksmas" },
  { img: "/games/g-nuotykis-2.webp", tag: "Nuotykis" },
  { video: "/games/g-cops-robbers.mp4", tag: "Veiksmas" },
  { video: "/games/g-nuotykis-5.mp4", tag: "Nuotykis" },
  { video: "/games/g-veiksmas-4.mp4", tag: "Nuotykis" },
  { img: "/games/g-nuotykis-3.webp", tag: "Nuotykis" },
  { video: "/games/g-veiksmas-3.mp4", tag: "Veiksmas" },
  { video: "/games/g-video.mp4", tag: "Nuotykis" },
];

export default function GamesGallery() {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const cards = Array.from(grid.children) as HTMLElement[];

    // reduced-motion arba nėra IO palaikymo: paliekam matomas, jokio judesio
    if (
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const reveal = (el: HTMLElement, idx: number) => {
      // stagger per stulpelį (grid-cols-2/3): kiekviena eilutė prasideda iš naujo
      el.style.transitionDelay = `${(idx % 3) * 60}ms`;
      el.style.opacity = "1";
      el.style.transform = "none";
    };

    // Fail-safe: jei IO nesuveiks visai — parodom viską be animacijos,
    // kad galerija niekada neliktų nematoma.
    const revealAllInstant = () => {
      cards.forEach((el) => {
        el.style.transition = "none";
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    };

    let ioFired = false;
    const observer = new IntersectionObserver(
      (entries) => {
        ioFired = true; // pradinis callback visada iššaunamas kai IO veikia
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target as HTMLElement;
          reveal(el, cards.indexOf(el));
          observer.unobserve(el);
        });
      },
      { threshold: 0.15 }
    );

    const hidden: HTMLElement[] = [];
    cards.forEach((el) => {
      const r = el.getBoundingClientRect();
      const alreadyInView = r.top < window.innerHeight && r.bottom > 0;
      // Kortelės, jau matomos pakrovus, lieka nepaliestos (be „flash")
      if (alreadyInView) return;
      el.style.opacity = "0";
      el.style.transform = "translateY(14px)";
      el.style.transition =
        "opacity .5s cubic-bezier(.16,.84,.32,1), transform .5s cubic-bezier(.16,.84,.32,1)";
      hidden.push(el);
      observer.observe(el);
    });

    // Watchdog: jei per 600ms IO neiššovė nė karto (sugedęs/neaktyvus) — atidengiam viską.
    const watchdog = window.setTimeout(() => {
      if (!ioFired && hidden.length) revealAllInstant();
    }, 600);

    return () => {
      window.clearTimeout(watchdog);
      observer.disconnect();
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-[1080px] px-6 md:px-10 pb-10 md:pb-16">
      <div className="text-center mb-7 md:mb-9">
        <h2 className="font-display uppercase text-white leading-[1.08] text-[clamp(24px,4.4vw,40px)]">
          Populiariausi žaidimai
        </h2>
      </div>
      <div ref={gridRef} className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        {GAMES.map((g, i) => (
          <div
            key={i}
            className="group relative overflow-hidden rounded-2xl border border-line bg-ink-card aspect-[4/3]"
          >
            {g.video ? (
              <video
                src={g.video}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <img
                src={g.img}
                alt={`BALA VR žaidimas – ${g.tag}`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            )}
            <span className="absolute top-2.5 left-2.5 rounded-full bg-ink/70 backdrop-blur-sm text-[11px] font-bold uppercase tracking-wide px-2.5 py-1 text-white">
              {g.tag}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
