"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";

// Moizmo „Dovanų kuponas" (gift card) srauto ID
const VOUCHER_FLOW_ID = "12590839-3489-44dd-a137-95bacc1baa10";

type NavLink = { href: string; label: string; voucher?: boolean };

const LINKS: NavLink[] = [
  { href: "/pabegimo-kambariai/kambariai", label: "Pabėgimo kambariai" },
  { href: "#kaip-vyksta", label: "Kaip vyksta" },
  { href: "#kainos", label: "Kainos" },
  { href: "#atsiliepimai", label: "Atsiliepimai" },
  { href: "#duk", label: "D.U.K." },
  { href: "/pabegimo-kambariai/blog", label: "Blogas" },
  { href: "#dovanu-kuponas", label: "Dovanų kuponas", voucher: true },
  { href: "#kontaktai", label: "Kontaktai" },
];

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

  const openVoucher = (e: MouseEvent<HTMLButtonElement>) => {
    setOpen(false);
    const w = window as unknown as {
      moizmo?: { show?: (id: string, btn?: EventTarget | null) => void };
    };
    if (w.moizmo && typeof w.moizmo.show === "function") {
      w.moizmo.show(VOUCHER_FLOW_ID, e.currentTarget);
    } else {
      window.open(
        `https://booking.moizmo.com/lt/booking/${VOUCHER_FLOW_ID}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <>
      {/* Moizmo booking skriptas — rankinis paleidimas (init(false)) */}
      <Script
        src="https://booking.moizmo.com/scripts/booking/v0/latest.js"
        strategy="afterInteractive"
        onLoad={() => {
          try {
            (
              window as unknown as { moizmo?: { init: (a: boolean) => void } }
            ).moizmo?.init(false);
          } catch {
            /* tyliai */
          }
        }}
      />
      {/* Moizmo dovanų kupono įterpimo elementas (gift card srautas) */}
      <div
        data-language="lt"
        data-moizmoFlowId={VOUCHER_FLOW_ID}
        data-moizmoGiftCard="1"
        aria-hidden="true"
      />

      <header
        className={`fixed inset-x-0 top-0 z-100 py-[18px] transition-[background,padding,border-color] duration-300 border-b border-transparent ${
          scrolled
            ? "bg-ink/92 backdrop-blur-[10px] py-3 border-line"
            : "bg-gradient-to-b from-ink/85 to-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1280px] px-6 md:px-10 min-[1200px]:px-14 flex items-center justify-between gap-5">
          <Link
            href="/pabegimo-kambariai"
            aria-label="Bala VR — pradžia"
            className="flex flex-col items-start justify-center"
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
            <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
              Virtualios realybės erdvė
            </span>
          </Link>
          <nav aria-label="Pagrindinė navigacija" className="hidden min-[960px]:flex items-center gap-[30px]">
            {LINKS.map((l) =>
              l.voucher ? (
                <button
                  key={l.href}
                  type="button"
                  onClick={openVoucher}
                  className="relative cursor-pointer py-1.5 text-sm font-semibold text-white hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:right-full after:bottom-0 after:h-[2px] after:bg-volt after:transition-[right] after:duration-200 hover:after:right-0"
                >
                  {l.label}
                </button>
              ) : (
                <a
                  key={l.href}
                  href={l.href}
                  className="relative py-1.5 text-sm font-semibold text-white hover:text-white transition-colors after:content-[''] after:absolute after:left-0 after:right-full after:bottom-0 after:h-[2px] after:bg-volt after:transition-[right] after:duration-200 hover:after:right-0"
                >
                  {l.label}
                </a>
              )
            )}
          </nav>
          <a
            href="#kontaktai"
            className="hidden min-[960px]:inline-flex items-center justify-center gap-2 rounded-full bg-volt px-6 py-3 text-sm font-bold text-volt-ink transition-transform hover:-translate-y-0.5 hover:bg-volt-deep"
          >
            Rezervuoti dabar
          </a>
          <button
            type="button"
            aria-label="Atidaryti meniu"
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            className="min-[960px]:hidden inline-flex flex-col justify-center items-center gap-[5px] w-11 h-11 rounded-[10px] border border-line-strong"
          >
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "translate-y-[7px] rotate-45" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-opacity ${open ? "opacity-0" : ""}`} />
            <span className={`block w-5 h-0.5 bg-white transition-transform ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
          </button>
        </div>
      </header>

      <div
        className={`min-[960px]:hidden fixed inset-0 z-99 bg-ink flex flex-col justify-start gap-1.5 px-6 pb-8 pt-[92px] overflow-y-auto transition-transform duration-300 ${
          open ? "translate-y-0" : "-translate-y-full"
        }`}
      >
        {LINKS.map((l) =>
          l.voucher ? (
            <button
              key={l.href}
              type="button"
              onClick={openVoucher}
              className="border-b border-line py-3 px-1 text-left font-display text-[clamp(28px,9vw,44px)] uppercase text-white"
            >
              {l.label}
            </button>
          ) : (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="border-b border-line py-3 px-1 font-display text-[clamp(28px,9vw,44px)] uppercase text-white"
            >
              {l.label}
            </a>
          )
        )}
        <a
          href="#kontaktai"
          onClick={() => setOpen(false)}
          className="mt-[22px] self-start inline-flex items-center justify-center gap-2 rounded-full bg-volt px-[30px] py-4 text-[15px] font-bold text-volt-ink"
        >
          Rezervuoti dabar
        </a>
      </div>
    </>
  );
}
