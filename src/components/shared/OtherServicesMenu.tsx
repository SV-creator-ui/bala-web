"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Service = { href: string; title: string; text: string };

// Visos BALA VR paslaugos — rodomos atskirame „Kitos pramogos" meniu, kad
// nesimaišytų su konkretaus puslapio skiltimis (Kainos, DUK...).
const SERVICES: Service[] = [
  { href: "/gimtadieniai", title: "Gimtadieniai", text: "Privati šventė su VR ir vaišėmis" },
  { href: "/pabegimo-kambariai", title: "Pabėgimo kambariai", text: "9 VR scenarijai, 2–6 žaidėjai" },
  { href: "/imonems", title: "Įmonėms", text: "Teambuildingas ir kolektyvų šventės" },
  { href: "/mokykloms", title: "Mokykloms", text: "Klasių išvykos ir šventės" },
  { href: "/komandiniai-vr-zaidimai", title: "VR veiksmo žaidimai", text: "Aktyvūs žaidimai iki 10 žaidėjų" },
  { href: "/pabegimo-kambariai/dovanu-kuponas", title: "Dovanų kuponas", text: "PDF el. paštu iš karto" },
];

const ACCENTS = {
  volt: { hover: "hover:border-volt", text: "group-hover/item:text-volt", ring: "border-volt" },
  amber: { hover: "hover:border-[#f0a500]", text: "group-hover/item:text-[#f0a500]", ring: "border-[#f0a500]" },
} as const;

/** Desktop išskleidžiamas „Kitos pramogos" meniu (šalia logotipo). */
export default function OtherServicesMenu({
  current,
  accent = "volt",
  className = "",
}: {
  /** Dabartinės paslaugos kelias — jis sąraše nerodomas. */
  current: string;
  accent?: keyof typeof ACCENTS;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const a = ACCENTS[accent];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-[14px] font-semibold text-white transition-colors ${
          open ? a.ring : `border-white/20 ${a.hover}`
        }`}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
        Kitos pramogos
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div
        className={`absolute left-0 top-[calc(100%+10px)] z-[120] w-[340px] origin-top-left rounded-2xl border border-white/12 bg-[#0b151d]/98 p-2 shadow-[0_24px_60px_-12px_rgba(0,0,0,0.7)] backdrop-blur-md transition-[opacity,transform] duration-150 ${
          open ? "visible opacity-100 scale-100" : "invisible opacity-0 scale-[0.97] pointer-events-none"
        }`}
      >
        <ul>
          {SERVICES.filter((s) => s.href !== current).map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                onClick={() => setOpen(false)}
                className="group/item block rounded-xl px-3.5 py-2.5 transition-colors hover:bg-white/[0.06]"
              >
                <span className={`block text-[15px] font-semibold text-white transition-colors ${a.text}`}>{s.title}</span>
                <span className="mt-0.5 block text-[13px] leading-[1.35] text-white/60">{s.text}</span>
              </a>
            </li>
          ))}
        </ul>
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="mt-1 flex items-center gap-2 border-t border-white/10 px-3.5 pb-1.5 pt-3 text-[13px] font-semibold text-white/70 transition-colors hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M19 12H5M11 18l-6-6 6-6" />
          </svg>
          Visos BALA VR pramogos
        </Link>
      </div>
    </div>
  );
}
