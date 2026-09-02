"use client";

import { useEffect } from "react";

/**
 * Patikimas nuslinkimas prie #sekcijos, kai puslapis atidaromas su hash'u
 * (pvz. atėjus iš subpuslapio per header nuorodą „Kainos" ->
 * /pabegimo-kambariai#kainos). Kadangi virš sekcijų yra vaizdo įrašas ir lazy
 * nuotraukos, naršyklės pirminis šuolis gali būti netikslus — pakartojam po to,
 * kai išdėstymas nusistovi. Header aukštį atsižvelgia scroll-padding-top (globals).
 */
export default function HashScroll() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!id) return;
    const go = () => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    };
    // Kelios bandymo bangos, kol turinys (nuotraukos/video) susidėlioja.
    const timers = [80, 350, 800, 1400].map((ms) => setTimeout(go, ms));
    return () => timers.forEach(clearTimeout);
  }, []);
  return null;
}
