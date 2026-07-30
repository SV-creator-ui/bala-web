"use client";

import Script from "next/script";

/**
 * Įkelia oficialų Moizmo Booking skriptą su rankiniu paleidimu (init(false)),
 * kad rezervaciją galėtume atidaryti per window.moizmo.show(flowId, btn)
 * iš savo mygtukų (žr. ReserveButton).
 */
export default function MoizmoLoader() {
  return (
    <Script
      src="https://booking.moizmo.com/scripts/booking/v0/latest.js"
      strategy="afterInteractive"
      onLoad={() => {
        try {
          if (window.moizmo) window.moizmo.init(false);
        } catch (e) {
          /* tyliai */
        }
      }}
    />
  );
}
