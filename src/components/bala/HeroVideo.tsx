"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero video (VR Cave treileris) – rodomas dešinėje hero pusėje 4:5 rėmelyje.
 * Naršyklės neleidžia auto-play su garsu, todėl video startuoja be garso, o
 * vartotojas gali įjungti garsą mygtuku. Gerbiamas „prefers-reduced-motion“.
 */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    v.muted = true;
    const p = v.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  }, []);

  const toggleSound = () => {
    const v = ref.current;
    if (!v) return;
    const next = !muted;
    v.muted = next;
    setMuted(next);
    if (!next) {
      // Įjungus garsą užtikriname, kad video groja
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    }
  };

  return (
    <div className="relative w-full max-w-[420px] mx-auto aspect-[4/5] overflow-hidden rounded-2xl border border-line-strong bg-ink-card shadow-[0_30px_90px_-24px_rgba(0,0,0,.75)]">
      <video
        ref={ref}
        className="absolute inset-0 w-full h-full object-cover"
        autoPlay
        muted={muted}
        loop
        playsInline
        preload="metadata"
      >
        <source src="/assets/vr-cave-trailer.mp4" type="video/mp4" />
      </video>

      {/* Švelnus rėmelio perdengimas – suliejimui su tamsiu fonu */}
      <div
        className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-inset ring-white/10"
        aria-hidden
      />

      {/* Plūduriuojanti atsiliepimo kortelė – social proof ant video */}
      <figure className="absolute top-3 left-3 z-2 max-w-[220px] rounded-xl border border-white/15 bg-ink/70 backdrop-blur-md px-3.5 py-3 shadow-[0_12px_30px_-10px_rgba(0,0,0,.7)]">
        <div className="flex items-center gap-1.5">
          <span className="text-volt text-[13px] leading-none tracking-[2px]" aria-hidden>★★★★★</span>
          <span className="sr-only">5 iš 5 žvaigždučių</span>
        </div>
        <blockquote className="mt-2 text-[11.5px] leading-[1.45] text-white/90">
          „Puikiai praleistas laikas! Buvau ne pirmą kartą ir tikrai dar sugrįšiu, kol išbandysiu visus 😊"
        </blockquote>
        <figcaption className="mt-1.5 text-[11px] font-bold uppercase tracking-wide text-white/65">
          Jovita A. · Google
        </figcaption>
      </figure>

      {/* Garso įjungimo / išjungimo mygtukas */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Įjungti garsą" : "Išjungti garsą"}
        aria-pressed={!muted}
        className="absolute bottom-3 right-3 z-2 inline-flex items-center gap-2 rounded-full border border-white/25 bg-ink/60 px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm transition-[background,border-color,transform] hover:-translate-y-0.5 hover:border-volt hover:text-volt"
      >
        {muted ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path d="M15.5 8.5a5 5 0 0 1 0 7" />
            <path d="M19 5a9 9 0 0 1 0 14" />
          </svg>
        )}
        {muted ? "Įjungti garsą" : "Nutildyti"}
      </button>
    </div>
  );
}
