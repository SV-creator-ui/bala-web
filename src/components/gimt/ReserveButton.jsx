"use client";

import { useEffect, useState } from "react";

/**
 * Rezervavimo mygtukas.
 * - Jei perduota `flowUrl` — atidaro rezervaciją iššokančiame lange (modalas su iframe),
 *   puslapis nepersikrauna.
 * - Jei ne — įprastas <a> su `href`.
 */
export default function ReserveButton({ href, flowUrl, className, style, children }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!flowUrl) {
    return (
      <a href={href} className={className} style={style}>
        {children}
      </a>
    );
  }

  return (
    <>
      <button
        type="button"
        className={className}
        style={style}
        onClick={() => setOpen(true)}
      >
        {children}
      </button>

      {open && (
        <div
          className="booking-modal-overlay"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-label="Rezervacija"
        >
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="booking-modal-close"
              onClick={() => setOpen(false)}
              aria-label="Uždaryti"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <iframe
              src={flowUrl}
              className="booking-modal-iframe"
              title="BALA VR rezervacija"
              loading="eager"
            />
          </div>
        </div>
      )}
    </>
  );
}
