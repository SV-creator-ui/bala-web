/**
 * Užimamo laiko LANGO skaičiavimas — vienas šaltinis abiem pusėms.
 *
 * `bookingWindow` grąžina langą DB įrašui / verslo kalendoriui:
 *   - kambarys/žaidimai: [pradžia, pradžia + roomDurationMin)
 *   - paketas:           [pradžia − buferisPrieš, aktyvi pabaiga)
 *
 * Grafiko LAISVUMĄ (persidengimus) skaičiuoja `availability.ts` iš GRYNŲ
 * (aktyvių) langų — `activeInterval` — pridedant būtiną tarpą tarp užsakymų
 * per `requiredGapMin` (tarpas priklauso nuo gretimų užsakymų tipų).
 * Grafikas bendras — tipai negali persidengti (talpa BOOKING.slotCapacity).
 */
import { BOOKING, toMin, toHHMM, type BookingType } from "./config";
import { getPartyPackage, partyDurationMin } from "./packages";

export type Interval = { startMin: number; endMin: number };

/** Intervalas su rezervacijos tipu — reikalingas tarpo tarp užsakymų skaičiavimui. */
export type TypedInterval = Interval & { type: BookingType };

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
    // Priešbuferis (svečiams atvykti / pasiruošti). Jei šventė prasideda
    // atidarymo metu — buferis „prigludinamas" prie atidarymo (pirma šventė
    // gali būti 10:00). Pabaiga — AKTYVI šventės pabaiga (be po-buferio): tarpą
    // po šventės (15 min prieš kambarį / 30 min prieš kitą šventę) suteikia
    // kitas užsakymas per requiredGapMin, todėl čia jo nedubliuojame — kitaip
    // verslo kalendorius rodytų salę užimtą tada, kai laikas jau parduotas.
    let startMin = start - BOOKING.partyBufferBeforeMin;
    if (openMin != null && startMin < openMin) startMin = openMin;
    return { startMin, endMin: start + dur };
  }
  // Įprastas kambario apsilankymas
  return { startMin: start, endMin: start + BOOKING.roomDurationMin };
}

/**
 * Aktyvios veiklos pabaiga minutėmis — BE po-buferio (tvarkymuisi).
 * Naudojama darbo laiko pabaigos patikrai: paskutinės dienos rezervacijos
 * tvarkymasis vyksta jau po uždarymo, todėl į darbo valandas jo neįskaičiuojame.
 * Kambariui po-buferio nėra, tad sutampa su bookingWindow pabaiga.
 */
export function activityEndMin(
  type: BookingType,
  time: string,
  packageId?: string | null,
  addons: string[] = [],
): number {
  const start = toMin(time);
  if (type === "party") {
    const pkg = getPartyPackage(packageId || "");
    const dur = pkg ? partyDurationMin(pkg, addons) : 0;
    return start + dur;
  }
  return start + BOOKING.roomDurationMin;
}

/**
 * GRYNAS veiklos langas (be jokių buferių) minutėmis: [pradžia, aktyvi pabaiga).
 * Naudojamas grafiko persidengimams — tarpai tarp užsakymų pridedami atskirai
 * per `requiredGapMin` (priklauso nuo gretimų užsakymų tipų).
 */
export function activeInterval(
  type: BookingType,
  time: string,
  packageId?: string | null,
  addons: string[] = [],
): Interval {
  return { startMin: toMin(time), endMin: activityEndMin(type, time, packageId, addons) };
}

/**
 * Būtinas TARPAS (min.) tarp ankstesnės rezervacijos PABAIGOS ir kitos PRADŽIOS.
 * Priklauso nuo to, KAS eina po ko:
 *   • → gimtadienis (party):                     30 min (pasiruošimas šventei);
 *   • gimtadienis → kambarys / žaidimai:         15 min (VR kambario susitvarkymas);
 *   • kambarys/žaidimai → kambarys/žaidimai:      0    (gali eiti iš karto).
 * Reikšmė = max(pasiruošimas kitam, susitvarkymas po ankstesnio).
 */
export function requiredGapMin(prevType: BookingType, nextType: BookingType): number {
  if (nextType === "party") return BOOKING.partyBufferBeforeMin; // 30 — prieš bet kokią šventę
  return prevType === "party" ? BOOKING.partyToNormalGapMin : 0; // 15 po šventės, kitaip 0
}

/**
 * Ar dvi rezervacijos konfliktuoja grafike, ĮSKAITANT būtiną tarpą tarp jų?
 * Ankstesnioji (pagal pradžią) turi baigtis + tarpas ne vėliau nei prasideda kita.
 */
export function conflictsWithGap(a: TypedInterval, b: TypedInterval): boolean {
  const [earlier, later] = a.startMin <= b.startMin ? [a, b] : [b, a];
  const gap = requiredGapMin(earlier.type, later.type);
  return earlier.endMin + gap > later.startMin;
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
