"use client";

/**
 * Rezervavimo mygtukas.
 * - Jei perduotas `flowId` — paspaudus atidaro Moizmo rezervacijos srautą
 *   iššokančiame lange (popup virš puslapio), puslapis nepersikrauna.
 *   Naudoja oficialų Moizmo skriptą (žr. MoizmoLoader).
 * - Jei ne — įprastas <a> su `href`.
 */
export default function ReserveButton({ href, flowId, className, style, children }) {
  if (!flowId) {
    return (
      <a href={href} className={className} style={style}>
        {children}
      </a>
    );
  }

  const handleClick = (e) => {
    if (
      typeof window !== "undefined" &&
      window.moizmo &&
      typeof window.moizmo.show === "function"
    ) {
      // Antras argumentas (mygtukas) — automatiniam mygtuko išjungimui paspaudus
      window.moizmo.show(flowId, e.currentTarget);
    } else {
      // Atsarginis variantas, jei skriptas dar neužsikrovė
      window.open(
        `https://booking.moizmo.com/lt/booking/${flowId}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <button type="button" className={className} style={style} onClick={handleClick}>
      {children}
    </button>
  );
}
