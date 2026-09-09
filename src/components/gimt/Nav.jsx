"use client";

import { useEffect, useState } from "react";

const BOOKING_URL = "/gimtadieniai/rezervacija";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Uždarom meniu paspaudus Esc + užrakinam body scroll kai atidarytas
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => setOpen(false);

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
        <li><a href="#pradzia">Pradžia</a></li>
        <li><a href="#kaip-vyksta">Kaip vyksta</a></li>
        <li><a href="#paketai">Paketai</a></li>
        <li><a href="#zaidimai">Populiariausi žaidimai</a></li>
        <li><a href="#akimirkos">Galerija</a></li>
        <li><a href="#atsiliepimai">Atsiliepimai</a></li>
        <li><a href="#duk">DUK</a></li>
        <li><a href="#kontaktai">Kontaktai</a></li>
      </ul>
      <a href="tel:+37068426686" className="nav-phone">
        +370 684 26686
      </a>
      <a href={BOOKING_URL} className="btn btn-primary nav-cta">
        REZERVUOTI
      </a>
      <button
        type="button"
        className={`nav-burger${open ? " is-open" : ""}`}
        aria-label={open ? "Uždaryti meniu" : "Atidaryti meniu"}
        aria-expanded={open}
        aria-controls="nav-mobile"
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden />
        <span aria-hidden />
        <span aria-hidden />
      </button>
      </div>

      {/* Mobile meniu — atidaromas pagal hamburger */}
      <div
        id="nav-mobile"
        className={`nav-mobile${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <button type="button" className="nav-mobile-backdrop" aria-label="Uždaryti meniu" onClick={close} />
        <div className="nav-mobile-panel">
          <button type="button" className="nav-mobile-close" aria-label="Uždaryti meniu" onClick={close}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <ul className="nav-mobile-links">
            <li><a href="#pradzia" onClick={close}>Pradžia</a></li>
            <li><a href="#kaip-vyksta" onClick={close}>Kaip vyksta</a></li>
            <li><a href="#paketai" onClick={close}>Paketai</a></li>
            <li><a href="#zaidimai" onClick={close}>Populiariausi žaidimai</a></li>
            <li><a href="#akimirkos" onClick={close}>Galerija</a></li>
            <li><a href="#atsiliepimai" onClick={close}>Atsiliepimai</a></li>
            <li><a href="#duk" onClick={close}>DUK</a></li>
            <li><a href="#kontaktai" onClick={close}>Kontaktai</a></li>
          </ul>
          <a href="tel:+37068426686" className="nav-mobile-phone" onClick={close}>
            +370 684 26686
          </a>
          <a href={BOOKING_URL} className="btn btn-primary nav-mobile-cta" onClick={close}>
            REZERVUOTI
          </a>
        </div>
      </div>
    </nav>
  );
}
