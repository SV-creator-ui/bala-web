"use client";

import { useEffect } from "react";

/**
 * Patikimas nuslinkimas prie #sekcijos, kai puslapis atidaromas su hash'u
 * (pvz. atėjus iš subpuslapio per header nuorodą „Kainos" ->
 * /pabegimo-kambariai#kainos). Kadangi virš sekcijų yra vaizdo įrašas ir lazy
 * nuotraukos, naršyklės pirminis šuolis gali būti netikslus — pakartojam po to,
 * kai išdėstymas nusistovi. Header aukštį atsižvelgia scroll-padding-top (globals).
 */
// Senojo puslapio (/vr-pabegimo-kambariai/) žymės, į kurias vis dar veda
// Google Ads papildomos nuorodos (sitelinks) -> dabartinės sekcijos.
const LEGACY_HASHES: Record<string, string> = {
  rezervacija: "kainos",
  zaidimai: "scenarijai",
  privalumai: "kam-tinka",
};

export default function HashScroll() {
  useEffect(() => {
    const raw = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    const id = LEGACY_HASHES[raw] ?? raw;
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
