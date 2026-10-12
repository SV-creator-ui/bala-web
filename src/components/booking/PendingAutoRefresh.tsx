"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const INTERVAL_MS = 4000;
const MAX_TRIES = 30; // ~2 min.

/**
 * „Laukiama apmokėjimo" būsenoje periodiškai perkrauna serverio komponentą.
 * Patvirtinimo puslapis kaskart pats paklausia Paysera būsenos, todėl kai tik
 * mokėjimas patvirtinamas, puslapis persijungia į „paid" ir suveikia
 * BookingConversionTracker (Google Ads / Meta konversija). Be šito konversija
 * prarandama, jei Paysera callback'as vėluoja grįžimo momentu.
 */
export default function PendingAutoRefresh() {
  const router = useRouter();
  const [tries, setTries] = useState(0);

  useEffect(() => {
    if (tries >= MAX_TRIES) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, INTERVAL_MS);
    return () => clearTimeout(t);
  }, [tries, router]);

  if (tries >= MAX_TRIES) return null;
  return (
    <p className="mt-4 text-[13px] opacity-70" aria-live="polite">
      Tikriname mokėjimo būseną…
    </p>
  );
}
