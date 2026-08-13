"use client";

/**
 * Rezervavimo mygtukas.
 * - Jei perduotas `flowId` — paspaudus atidaro Moizmo rezervacijos srautą
 *   iššokančiame lange (popup virš puslapio), puslapis nepersikrauna.
 *   Reikalingas paslėptas <div data-moizmoFlowId> elementas — į jį Moizmo
 *   įdeda iframe, kurį per postMessage paverčia modalu (žr. MoizmoLoader).
 * - Jei ne — įprastas <a> su `href`.
 */
export default function ReserveButton({
  href,
  flowId,
  language = "lt",
  className,
  style,
  children,
}) {
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
        `https://booking.moizmo.com/${language}/booking/${flowId}`,
        "_blank",
        "noopener,noreferrer"
      );
    }
  };

  return (
    <>
      <button type="button" className={className} style={style} onClick={handleClick}>
        {children}
      </button>
      {/* Moizmo įterpimo elementas — čia įdedamas rezervacijos iframe/modalas.
          position:absolute — kad tuščias konteineris neįtrauktų flex tarpo ir
          nepaslinktų mygtuko (kitaip kortelės su flowId kaina/mygtukas nesutampa). */}
      <div
        data-moizmoFlowId={flowId}
        data-language={language}
        aria-hidden="true"
        style={{ position: "absolute" }}
      />
    </>
  );
}
