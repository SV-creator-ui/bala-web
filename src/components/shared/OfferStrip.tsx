"use client";

/**
 * Plona pasiūlymo juosta puslapio viršuje („Gimtadieniai pirm.–ketv.: −20 €").
 *
 * Gimtadienių meniu yra `fixed`, todėl juosta irgi fixed ir nustato CSS
 * kintamąjį `--offer-h` — meniu per jį nusileidžia žemyn (žr. gimt.css `.nav`).
 * Rodoma tik /gimtadieniai puslapyje. Nuslinkus puslapį, uždarius juostą ar atidarius mobilų meniu
 * kintamasis grįžta į 0 ir juosta paslepiama.
 */
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { WEEKDAY_OFFER } from "@/lib/offers";

const BAR_H = 34;
const STORAGE_KEY = `offer-dismissed:${WEEKDAY_OFFER.id}`;

const DISMISS_EVENT = "offer-dismissed";

function subscribeDismissed(cb: () => void) {
  window.addEventListener(DISMISS_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(DISMISS_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
function storedDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Rodoma tik gimtadienių puslapyje (ne rezervacijoje ir ne pabėgimo kambarių puslapiuose). */
function hiddenOnPath(path: string): boolean {
  return !path.startsWith("/gimtadieniai") || /rezervacija|patvirtinta/.test(path);
}

export default function OfferStrip() {
  const pathname = usePathname() || "";
  // Serveryje (ir hidratacijos metu) laikome „uždaryta", kad nebūtų mirgėjimo.
  const storedClosed = useSyncExternalStore(subscribeDismissed, storedDismissed, () => true);
  const [closedNow, setClosedNow] = useState(false); // jei localStorage nepasiekiamas
  const dismissed = storedClosed || closedNow;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Abu meniu, atsidarydami mobilų meniu, uždeda body overflow:hidden.
  useEffect(() => {
    const sync = () => setMenuOpen(document.body.style.overflow === "hidden");
    const mo = new MutationObserver(sync);
    mo.observe(document.body, { attributes: true, attributeFilter: ["style"] });
    return () => mo.disconnect();
  }, []);

  const enabled = WEEKDAY_OFFER.active && !hiddenOnPath(pathname);
  const visible = enabled && !dismissed && !scrolled && !menuOpen;

  useEffect(() => {
    document.documentElement.style.setProperty("--offer-h", visible ? `${BAR_H}px` : "0px");
    return () => {
      document.documentElement.style.setProperty("--offer-h", "0px");
    };
  }, [visible]);

  if (!enabled || dismissed) return null;

  const close = () => {
    setClosedNow(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
      window.dispatchEvent(new Event(DISMISS_EVENT));
    } catch {
      /* privatus režimas — paslepiame tik šiam puslapio atidarymui */
    }
  };

  return (
    <div
      role="region"
      aria-label="Pasiūlymas"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: BAR_H,
        zIndex: 98,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: "0 36px 0 12px",
        background: "#f0a500", // gimtadienių puslapio gintarinė (--amber)
        color: "#0d2b35", // --teal-deep
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "0.01em",
        lineHeight: 1,
        whiteSpace: "nowrap",
        transform: visible ? "translateY(0)" : `translateY(-${BAR_H}px)`,
        transition: "transform 0.3s ease",
      }}
    >
      <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{WEEKDAY_OFFER.barText}</span>
      <a
        href={WEEKDAY_OFFER.href}
        style={{ color: "inherit", textDecoration: "underline", textUnderlineOffset: 3, flex: "none" }}
      >
        {WEEKDAY_OFFER.barCta} →
      </a>
      <button
        type="button"
        onClick={close}
        aria-label="Uždaryti pasiūlymą"
        style={{
          position: "absolute",
          right: 6,
          top: 0,
          height: BAR_H,
          width: 34,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          border: 0,
          color: "inherit",
          cursor: "pointer",
          fontSize: 18,
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </div>
  );
}
