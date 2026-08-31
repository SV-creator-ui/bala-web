/**
 * Užimamo laiko LANGO skaičiavimas — vienas šaltinis abiem pusėms.
 * Kiekviena rezervacija grafike užima intervalą [startMin, endMin):
 *   - kambarys: [pradžia, pradžia + roomDurationMin)
 *   - paketas:  [pradžia − buferisPrieš, pradžia + paketoTrukmė + buferisPo)
 * Grafikas bendras — tipai negali persidengti (talpa BOOKING.slotCapacity).
 */
import { BOOKING, toMin, toHHMM, type BookingType } from "./config";
import { getPartyPackage, partyDurationMin } from "./packages";

export type Interval = { startMin: number; endMin: number };

/**
 * Užimtas laiko langas minutėmis pagal rezervacijos tipą ir pradžios laiką.
 * `time` — klientui rodomas pradžios laikas "HH:MM".
 */
export function bookingWindow(
  type: BookingType,
  time: string,
  packageId?: string | null,
  addons: string[] = [],
  openMin?: number,
): Interval {
  const start = toMin(time);
  if (type === "party") {
    const pkg = getPartyPackage(packageId || "");
    const dur = pkg ? partyDurationMin(pkg, addons) : 0;
    // Priešbuferis (svečiams atvykti). Jei šventė prasideda atidarymo metu —
    // buferis „prigludinamas" prie atidarymo (pirma šventė gali būti 10:00).
    let startMin = start - BOOKING.partyBufferBeforeMin;
    if (openMin != null && startMin < openMin) startMin = openMin;
    return { startMin, endMin: start + dur + BOOKING.partyBufferAfterMin };
  }
  // Įprastas kambario apsilankymas
  return { startMin: start, endMin: start + BOOKING.roomDurationMin };
}

/** Tas pats langas, bet "HH:MM" formatu (saugojimui DB: block_start / block_end). */
export function bookingWindowHHMM(
  type: BookingType,
  time: string,
  packageId?: string | null,
  addons: string[] = [],
  openMin?: number,
): { blockStart: string; blockEnd: string } {
  const w = bookingWindow(type, time, packageId, addons, openMin);
  return { blockStart: toHHMM(w.startMin), blockEnd: toHHMM(w.endMin) };
}

/** Ar du intervalai persidengia (pusiau atviri [start,end))? */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}
