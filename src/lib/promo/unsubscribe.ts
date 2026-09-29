/**
 * Atsisakymas nuo rinkodaros laiškų: pasirašytas (HMAC) tokenas, kad niekas
 * negalėtų atsisakyti svetimo el. pašto. Tokenas nesikeičia — vienas email = vienas token.
 * Slaptas raktas: UNSUBSCRIBE_SECRET (tas pats vietoje ir gyvoje svetainėje, kad laiškai,
 * išsiųsti iš bet kur, turėtų galiojančias nuorodas); atsarginiai: CRON_SECRET, ADMIN_PASSWORD.
 */
import { createHmac, timingSafeEqual } from "node:crypto";
import { normalizeEmail } from "./storage";

function secret(): string {
  return process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || process.env.ADMIN_PASSWORD || "dev-only-unsubscribe-secret";
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://bala.lt").replace(/\/$/, "");
}

export function unsubscribeToken(email: string): string {
  return createHmac("sha256", secret()).update(normalizeEmail(email)).digest("hex").slice(0, 32);
}

export function verifyUnsubscribeToken(email: string, token: string): boolean {
  if (!email || !token) return false;
  const expected = Buffer.from(unsubscribeToken(email));
  const given = Buffer.from(String(token));
  return expected.length === given.length && timingSafeEqual(expected, given);
}

/** Nuoroda į patvirtinimo puslapį (rodoma laiško apačioje). */
export function unsubscribePageUrl(email: string): string {
  const e = encodeURIComponent(normalizeEmail(email));
  return `${siteUrl()}/atsisakyti?e=${e}&t=${unsubscribeToken(email)}`;
}

/** Vieno paspaudimo atsisakymo endpoint'as (List-Unsubscribe antraštei, POST). */
export function unsubscribeApiUrl(email: string): string {
  const e = encodeURIComponent(normalizeEmail(email));
  return `${siteUrl()}/api/unsubscribe?e=${e}&t=${unsubscribeToken(email)}`;
}
