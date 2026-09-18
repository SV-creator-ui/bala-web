"use client";

import { useEffect, useRef } from "react";
import {
  ANALYTICS_READY_EVENT,
  ADS_CONVERSION_BOOKING,
  ADS_CONVERSION_GIFT_CARD,
  trackAdsConversion,
  trackMetaPurchase,
  trackOpenAiPurchase,
} from "@/lib/analytics";

type Props = {
  transactionId: string; // unikalus ID: booking.merchant_reference arba voucher.code
  value: number; // realia sumą EUR (avansas booking'ui, pilna kaina kuponui)
  email?: string; // Enhanced Conversions (klientas Google Ads hash'ins pats)
  sendTo?: string; // konversijos label; default = Rezervacija
};

/**
 * Universalus konversijų tracker'is — iššauna vieną kartą per mount'ą kai
 * puslapis rodo sėkmingą būseną (paid/active). Vienu metu siunčia:
 *  - Google Ads konversiją (sendTo label — booking arba gift_card)
 *  - Meta Pixel Purchase eventą (content_name = booking/gift_card)
 *  - OpenAI (ChatGPT Ads) Pixel Purchase eventą (event_id = transactionId)
 * Naudojamas:
 *  - rezervacijų `patvirtinta` puslapiuose (sendTo = ADS_CONVERSION_BOOKING)
 *  - dovanų kuponų `patvirtinta` puslapyje (sendTo = ADS_CONVERSION_GIFT_CARD)
 * `transactionId` (Google `transaction_id` + Meta `eventID`) — dedupe.
 */
export default function BookingConversionTracker({
  transactionId,
  value,
  email,
  sendTo = ADS_CONVERSION_BOOKING,
}: Props) {
  const adsFiredRef = useRef(false);
  const metaFiredRef = useRef(false);
  const openAiFiredRef = useRef(false);

  useEffect(() => {
    if (!transactionId) return;
    const contentName =
      sendTo === ADS_CONVERSION_GIFT_CARD ? "gift_card" : "booking";

    const attempt = () => {
      if (!adsFiredRef.current) {
        adsFiredRef.current = trackAdsConversion(sendTo, value, transactionId, email);
      }
      if (!metaFiredRef.current) {
        metaFiredRef.current = trackMetaPurchase(transactionId, value, contentName);
      }
      if (!openAiFiredRef.current) {
        openAiFiredRef.current = trackOpenAiPurchase(transactionId, value, contentName);
      }
    };

    attempt();
    window.addEventListener(ANALYTICS_READY_EVENT, attempt);
    return () => window.removeEventListener(ANALYTICS_READY_EVENT, attempt);
  }, [transactionId, value, email, sendTo]);

  return null;
}
