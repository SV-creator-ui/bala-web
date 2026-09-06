"use client";

import { useEffect, useState } from "react";

const BOOKING_URL = "/gimtadieniai/rezervacija";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav className={`nav${scrolled ? " scrolled" : ""}`}>
      <div className="nav-inner">
      <a href="/" className="nav-back" aria-label="Grįžti į pramogų pasirinkimą" title="Kitos pramogos">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d="M19 12H5M11 18l-6-6 6-6" />
        </svg>
      </a>
      <a href="#pradzia" className="nav-brand" aria-label="BALA VR — į pradžią">
        <span className="nav-brand-text">
          <span className="brand-bala">BALA</span>
          <span className="brand-vr">VR</span>
        </span>
      </a>
      <ul className="nav-links">
        <li>
          <a href="#kaip-vyksta">Kaip vyksta</a>
        </li>
        <li>
          <a href="#paketai">Paketai</a>
        </li>
        <li>
          <a href="#atsiliepimai">Atsiliepimai</a>
        </li>
        <li>
          <a href="#duk">DUK</a>
        </li>
        <li>
          <a href="#kontaktai">Kontaktai</a>
        </li>
      </ul>
      <a href="tel:+37068426686" className="nav-phone">
        +370 684 26686
      </a>
      <a href={BOOKING_URL} className="btn btn-primary nav-cta">
        REZERVUOTI
      </a>
      </div>
    </nav>
  );
}
