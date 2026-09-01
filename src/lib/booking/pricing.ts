/**
 * Kainodara — realios kainos iš bala-web puslapio (be savaitgalio skirtumo).
 * Naudojama IR kliento pusėje (rodymui), IR serveryje (galutinis skaičiavimas —
 * niekada nepasitikime kliento atsiųsta suma).
 */
import { ADDONS, BOOKING } from "./config";

/** Kaina grupei už patį žaidimą pagal žaidėjų skaičių */
export function roomsPrice(players: number): number {
  if (players <= 2) return 50;
  if (players === 3) return 65;
  return 20 * players; // 4–10 asm. po 20 €/asm.
}

/**
 * Kaina grupei už komandinius VR žaidimus pagal žaidėjų skaičių.
 * 2 žaid. → 50 €, 3 žaid. → 60 €, kiekvienas papildomas (nuo 4) +20 €.
 */
export function gamesPrice(players: number): number {
  if (players <= 2) return 50;
  return 20 * players; // 3 → 60, 4 → 80 … 10 → 200
}

/** Pasirinktų priedų suma */
export function addonsPrice(addonIds: string[]): number {
  return ADDONS.filter((a) => addonIds.includes(a.id)).reduce((s, a) => s + a.price, 0);
}

/** Bendra suma (žaidimas + priedai) */
export function grandTotal(players: number, addonIds: string[] = []): number {
  return roomsPrice(players) + addonsPrice(addonIds);
}

/** Avansas — fiksuotas */
export const depositEur = BOOKING.depositEur;

/** Suformatuoja eurus lietuviškai, pvz. 65 -> "65", 21.666 -> "21,67" */
export function formatEur(n: number): string {
  return n.toLocaleString("lt-LT", {
    minimumFractionDigits: n % 1 ? 2 : 0,
    maximumFractionDigits: 2,
  });
}
