"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Cinematinis loop'as kortelėje (Higgsfield image-to-video iš scenarijaus plakato).
 * Groja be garso, kartojasi, seamless (start = end kadras). Gerbia
 * „prefers-reduced-motion“ – tuomet rodomas tik statiškas poster kadras.
 * Failai: /assets/loops/<slug>.webm, .mp4, .jpg
 */
export default function CardLoop({ slug, alt }: { slug: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [motionOk, setMotionOk] = useState(true);
  const base = `/assets/loops/${slug}`;

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMotionOk(false);
      return;
    }
    const v = ref.current;
    if (!v) return;
    v.muted = true;
    v.setAttribute("muted", ""); // iOS: `muted` privalo būti atributas, kad autoplay veiktų

    let visible = false;
    const tryPlay = () => {
      if (!visible) return;
      v.muted = true; // React kartais nepritaiko `muted` atributo – nustatom tiesiogiai
      const p = v.play();
      if (p && typeof p.catch === "function") p.catch(() => {});
    };

    // Mobilios naršyklės neleidžia autoplay kortelėms, esančioms už ekrano ribų.
    // Grojam kai kortelė matoma, stabdom kai išeina (taupo bateriją/duomenis).
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          visible = e.isIntersecting;
          if (visible) tryPlay();
          else v.pause();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(v);

    // Atsarga (iOS Low Power Mode / blokuotas autoplay): paleisti kai video
    // pasiruošęs ir po pirmo vartotojo prisilietimo / slinkties.
    v.addEventListener("canplay", tryPlay);
    const onGesture = () => tryPlay();
    window.addEventListener("touchstart", onGesture, { passive: true });
    window.addEventListener("scroll", onGesture, { passive: true });
    window.addEventListener("pointerdown", onGesture, { passive: true });

    return () => {
      io.disconnect();
      v.removeEventListener("canplay", tryPlay);
      window.removeEventListener("touchstart", onGesture);
      window.removeEventListener("scroll", onGesture);
      window.removeEventListener("pointerdown", onGesture);
    };
  }, []);

  if (!motionOk) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={`${base}.jpg`}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        loading="lazy"
        draggable={false}
      />
    );
  }

  return (
    <video
      ref={ref}
      className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      poster={`${base}.jpg`}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={alt}
    >
      {/* mp4 PIRMAS — iOS Safari nepalaiko VP9 webm ir kartais neperšoka į fallback (rodo tik poster'į) */}
      <source src={`${base}.mp4`} type="video/mp4" />
      <source src={`${base}.webm`} type="video/webm" />
    </video>
  );
}
