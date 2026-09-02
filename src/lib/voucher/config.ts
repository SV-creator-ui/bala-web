/**
 * Dovanų kuponų konfigūracija — VIENAS TIESOS ŠALTINIS.
 * Naudojama ir kliento pusėje (pirkimo forma), ir serveryje (validacija).
 */

/** Siūlomos fiksuotos kupono vertės (EUR) — mygtukai formoje. */
export const VOUCHER_PRESETS = [30, 50, 70, 100] as const;

/** Laisvos (savos) sumos ribos (EUR, sveiki eurai). */
export const VOUCHER_MIN = 20;
export const VOUCHER_MAX = 300;

/** Kiek mėnesių galioja kuponas nuo apmokėjimo. */
export const VOUCHER_VALID_MONTHS = 6;

/**
 * Ar suma tinkama kuponui: sveikas euras nuo VOUCHER_MIN iki VOUCHER_MAX.
 * (Fiksuotos vertės telpa į šį intervalą, tad viena taisyklė apima viską.)
 */
export function validVoucherAmount(n: unknown): n is number {
  return typeof n === "number" && Number.isInteger(n) && n >= VOUCHER_MIN && n <= VOUCHER_MAX;
}

/** Galiojimo data (YYYY-MM-DD) nuo apmokėjimo momento. */
export function voucherValidUntil(from: Date = new Date()): string {
  const d = new Date(from);
  d.setMonth(d.getMonth() + VOUCHER_VALID_MONTHS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * Kupono kodo abėcėlė — be lengvai supainiojamų simbolių (0/O, 1/I).
 * Formatas: BALA-XXXX-XXXX.
 */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** Sugeneruoja atsitiktinį kupono kodą, pvz. "BALA-A7K4-9QMX". */
export function generateVoucherCode(): string {
  const block = (len: number) =>
    Array.from({ length: len }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join("");
  return `BALA-${block(4)}-${block(4)}`;
}

/** Normalizuoja kliento įvestą kodą (didžiosios raidės, be tarpų). */
export function normalizeVoucherCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
