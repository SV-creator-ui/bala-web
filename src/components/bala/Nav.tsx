"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import OtherServicesMenu from "@/components/shared/OtherServicesMenu";

type NavLink = { href: string; label: string; wide?: boolean };

// Anchor'ai nurodyti su pilnu keliu, kad veiktų ir iš subpuslapių
// (kambariai, blogas, kuponas), ne tik iš pagrindinio puslapio.
const PAGE_LINKS: NavLink[] = [
  { href: "/pabegimo-kambariai/kambariai", label: "Pabėgimo kambariai" },
  { href: "/pabegimo-kambariai#kaip-vyksta", label: "Kaip vyksta" },
  { href: "/pabegimo-kambariai#kainos", label: "Kainos" },
  { href: "/pabegimo-kambariai#atsiliepimai", label: "Atsiliepimai" },
  { href: "/pabegimo-kambariai#duk", label: "D.U.K." },
  { href: "/pabegimo-kambariai/blog", label: "Blogas" },
  { href: "/pabegimo-kambariai#kontaktai", label: "Kontaktai" },
];

// Kitos BALA VR paslaugos (mobile meniu apačioje; desktop — „Kitos pramogos" meniu).
const SITE_LINKS: NavLink[] = [
  { href: "/gimtadieniai", label: "Gimtadieniai" },
  { href: "/imonems", label: "Įmonėms" },
  { href: "/mokykloms", label: "Mokykloms" },
  { href: "/komandiniai-vr-zaidimai", label: "VR veiksmo žaidimai" },
  { href: "/pabegimo-kambariai/dovanu-kuponas", label: "Dovanų kuponas" },
];

// Desktop juostoje — tik šio puslapio skiltys; kitos paslaugos atskirame meniu prie logotipo.
// `wide` — rodoma tik nuo 1280px, kad siauresniame desktop'e tilptų CTA mygtukas.
const DESKTOP_PAGE_LINKS: NavLink[] = [
  PAGE_LINKS[0],
  PAGE_LINKS[1],
  PAGE_LINKS[2],
  { ...PAGE_LINKS[3], wide: true },
  { ...PAGE_LINKS[4], wide: true },
];

const DESKTOP_LINK_CLASS =
  "relative py-1.5 text-sm font-semibold text-white whitespace-nowrap hover:text-white transition-colors after:content-[''] after:absolute after:inset-x-0 after:bottom-0 after:h-[2px] after:bg-volt after:origin-left after:scale-x-0 after:transition-transform after:duration-200 after:ease-[var(--ease-out-premium)] hover:after:scale-x-100 focus-visible:after:scale-x-100";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    document.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // Mobile meniu: kol jis atidarytas, body turi overflow:hidden — iOS Safari tada
  // neatlieka naršyklės šuolio į #sekciją. Tame pačiame puslapyje slenkame patys,
  // o po ~0,9 s pataisome poziciją, jei lazy nuotraukos virš sekcijos pakeitė išdėstymą.
  const onMobileLinkClick = (e: MouseEvent<HTMLAnchorElement>, href: string) => {
    setOpen(false);
    const url = new URL(href, window.location.href);
    if (url.pathname !== window.location.pathname || !url.hash) return;
    const el = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!el) return;
    e.preventDefault();
    window.history.pushState(null, "", url.hash);
    requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "start" }));
    setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 900);
  };

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-100 py-[18px] transition-[background,padding,border-color] duration-300 border-b border-transparent ${
          scrolled
            ? "bg-ink/92 backdrop-blur-[10px] py-3 border-line"
            : "bg-gradient-to-b from-ink/85 to-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 flex items-center justify-between gap-5">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              aria-label="Grįžti į pramogų pasirinkimą"
              title="Kitos pramogos"
              className="inline-flex min-[1100px]:hidden h-9 w-9 flex-none items-center justify-center rounded-full border border-line-strong text-smoke transition-colors hover:border-volt hover:text-white"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M19 12H5M11 18l-6-6 6-6" />
              </svg>
            </Link>
            <Link
              href="/pabegimo-kambariai"
              aria-label="Bala VR — pradžia"
              className="flex flex-col items-center justify-center"
              onClick={(e) => {
                // Pradiniame puslapyje – nuslinkti į viršų ir išvalyti #hash iš URL
                if (window.location.pathname === "/pabegimo-kambariai") {
                  e.preventDefault();
                  setOpen(false);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  window.history.replaceState(null, "", "/pabegimo-kambariai");
                }
              }}
            >
              <Image src="/assets/logo-bala-vr-wordmark.png" alt="Bala VR" width={264} height={48} className="h-[26px] w-auto" priority />
              <span className="mt-1 whitespace-nowrap text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
                Virtualios realybės erdvė
              </span>
            </Link>
            <OtherServicesMenu current="/pabegimo-kambariai" className="hidden min-[1100px]:block ml-3" />
          </div>
          <nav aria-label="Pagrindinė navigacija" className="hidden min-[1100px]:flex items-center gap-[20px]">
            {DESKTOP_PAGE_LINKS.map((l) => (
              <a key={l.href} href={l.href} className={`${DESKTOP_LINK_CLASS} ${l.wide ? "hidden min-[1280px]:inline" : ""}`}>
                {l.label}
              </a>
            ))}
          </nav>
          <a
            href="/rezervacija"
            className="hidden min-[1100px]:inline-flex items-center justify-center whitespace-nowrap rounded-full bg-volt px-[30px] py-4 text-[15px] font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
          >
            Rezervuoti dabar
          </a>
          <button
            type="button"
            aria-label="Atidaryti meniu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="min-[1100px]:hidden inline-flex flex-col justify-center items-center gap-[5px] w-11 h-11 rounded-[10px] border border-line-strong"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      <div
        className={`min-[1100px]:hidden fixed inset-0 z-99 bg-ink flex flex-col justify-start gap-1.5 px-6 pb-8 pt-[92px] overflow-y-auto transition-transform duration-300 ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mb-1 inline-flex items-center gap-2 self-start text-[15px] font-semibold text-smoke transition-colors hover:text-white"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Kitos pramogos
        </Link>
        {PAGE_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={(e) => onMobileLinkClick(e, l.href)}
            className="border-b border-line py-2.5 px-1 font-display text-[clamp(24px,7.5vw,40px)] uppercase text-white"
          >
            {l.label}
          </a>
        ))}
        <a
          href="/rezervacija"
          onClick={() => setOpen(false)}
          className="mt-[22px] self-start inline-flex items-center justify-center gap-2 rounded-full bg-volt px-[30px] py-4 text-[15px] font-bold text-volt-ink"
        >
          Rezervuoti dabar
        </a>
        <p className="mt-7 mb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-smoke-2">
          Kitos BALA VR pramogos
        </p>
        <div className="mb-3 flex flex-wrap gap-2">
          {SITE_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className={`inline-flex items-center rounded-full border px-4 py-2.5 text-[15px] font-semibold text-white transition-colors ${
                l.href === "/gimtadieniai"
                  ? "border-[#f0a500] bg-[rgba(240,165,0,0.14)]"
                  : "border-line-strong bg-white/[0.04] hover:border-volt"
              }`}
            >
              {l.label}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
