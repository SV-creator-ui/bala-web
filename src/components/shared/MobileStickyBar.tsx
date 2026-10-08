"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Lipni apatinė juosta mobiliam (<900px): skambutis + du tiesioginiai rezervacijos keliai.
 * Pasirodo nuslinkus žemiau antraštės, kad neuždengtų pirmo ekrano.
 */
export default function MobileStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 320);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      aria-hidden={!visible}
      className={`min-[900px]:hidden fixed inset-x-0 bottom-0 z-[90] border-t border-white/10 bg-ink/95 backdrop-blur-md px-3 pt-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] transition-transform duration-300 ease-[var(--ease-out-premium)] ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="mx-auto flex max-w-[560px] items-stretch gap-2">
        <a
          href="tel:+37068426686"
          aria-label="Skambinti +370 684 26686"
          tabIndex={visible ? 0 : -1}
          className="grid h-12 w-12 flex-none place-items-center rounded-full border border-white/20 bg-white/[0.06] text-white active:scale-95 transition-transform"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.11 4.18 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.1 9.9a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
        </a>
        <Link
          href="/gimtadieniai/rezervacija"
          tabIndex={visible ? 0 : -1}
          className="flex h-12 flex-1 items-center justify-center rounded-full whitespace-nowrap px-3 text-[14px] font-bold text-[#0d2b35] active:scale-[0.97] transition-transform"
          style={{ background: "linear-gradient(180deg, #ffbf33 0%, #f0a500 100%)" }}
        >
          Gimtadienis
        </Link>
        <Link
          href="/rezervacija"
          tabIndex={visible ? 0 : -1}
          className="flex h-12 flex-[1.3] items-center justify-center rounded-full whitespace-nowrap bg-volt px-3 text-[14px] font-bold text-volt-ink active:scale-[0.97] transition-transform"
        >
          Pabėgimo kambarys
        </Link>
      </div>
    </div>
  );
}
