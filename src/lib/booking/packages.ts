/**
 * Gimtadienių / šventinių paketų VIENAS TIESOS ŠALTINIS.
 * Naudojama ir kliento pusėje (rodymui), ir serveryje (galutinis kainos bei
 * užimto laiko lango skaičiavimas — klientui nepasitikime).
 *
 * Duomenys atitinka viešą kainoraštį (gimtadieniai / Packages.jsx).
 */
import { BOOKING } from "./config";
import { isPublicHoliday } from "./holidays";

export type PartyPackageId = "maksi" | "vip" | "gold";

export type PartyPackage = {
  id: PartyPackageId;
  name: string;
  /** Trumpas trukmės žymuo kortelėje, pvz. "2 val." */
  durationLabel: string;
  /** Paties paketo (šventės) trukmė minutėmis — BE buferių prieš/po */
  durationMin: number;
  /** Pilna paketo kaina eurais (bazinė, be I–IV nuolaidos) */
  price: number;
  /** Didžiausias dalyvių skaičius */
  maxPlayers: number;
  /** VR akinių skaičius (info) */
  vrHeadsets: number;
  tagline: string;
  features: string[];
  featured?: boolean;
};

export const PARTY_PACKAGES: readonly PartyPackage[] = [
  {
    id: "maksi",
    name: "MAKSI",
    durationLabel: "2 val.",
    durationMin: 120,
    price: 239,
    maxPlayers: 12,
    vrHeadsets: 6,
    tagline: "Populiariausias pasirinkimas 10–12 vaikų gimtadieniui.",
    features: [
      "2 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 12 žaidėjų, 6 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Instruktoriaus priežiūra",
    ],
  },
  {
    id: "vip",
    name: "VIP",
    durationLabel: "2,5 val.",
    durationMin: 150,
    price: 289,
    maxPlayers: 14,
    vrHeadsets: 7,
    tagline: "Dar daugiau VR žaidimų, daugiau laiko tortui ir mažiau skubėjimo.",
    features: [
      "2,5 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 14 žaidėjų, 7 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Interaktyvi siena",
      "Kava ir arbata tėveliams",
      "Instruktoriaus priežiūra",
    ],
    featured: true,
  },
  {
    id: "gold",
    name: "GOLD",
    durationLabel: "3 val.",
    durationMin: 180,
    price: 359,
    maxPlayers: 16,
    vrHeadsets: 8,
    tagline: "Kai norite išskirtinės šventės su daug laiko VR ir poilsiui.",
    features: [
      "3 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 16 žaidėjų, 8 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Interaktyvi siena",
      "Kava ir arbata tėveliams",
      "Instruktoriaus priežiūra",
    ],
  },
] as const;

/** Paketo papildymai. `durationDeltaMin` prailgina užimtą laiką grafike. */
export type PartyExtra = {
  id: string;
  name: string;
  desc: string;
  price: number;
  durationDeltaMin: number;
};

export const PARTY_EXTRAS: readonly PartyExtra[] = [
  {
    id: "vrmax",
    name: "VR MAX",
    desc: "Trumpiname pertraukas ir skiriame maksimaliai laiką VR žaidimams.",
    price: 20,
    durationDeltaMin: 0,
  },
  {
    id: "extratime",
    name: "Papildomas laikas (+15 min.)",
    desc: "Kai šventė įsisiūbuoja ir nesinori skubėti namo.",
    price: 30,
    durationDeltaMin: 15,
  },
  {
    id: "popcorn",
    name: "Kino vakaro popkornas",
    desc: "Šviežias, gardžiai kvepiantis popkornas — iškart sukuria šventinę nuotaiką.",
    price: 10,
    durationDeltaMin: 0,
  },
] as const;

/** I–IV dienų (pirmadienis–ketvirtadienis) nuolaida eurais. */
export const PARTY_WEEKDAY_DISCOUNT_EUR = 20;

export function getPartyPackage(id: string): PartyPackage | undefined {
  return PARTY_PACKAGES.find((p) => p.id === id);
}

/** Ar data yra I–IV (pirmadienis–ketvirtadienis)? */
export function isDiscountWeekday(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const wd = d.getDay(); // 0 sekm. … 6 šešt.
  return wd >= 1 && wd <= 4;
}

/**
 * Ar konkrečiai datai galioja I–IV nuolaida?
 * Taip, jei tai pirmadienis–ketvirtadienis IR ne valstybinė šventė.
 */
export function isDiscountDay(dateStr: string): boolean {
  return isDiscountWeekday(dateStr) && !isPublicHoliday(dateStr);
}

/** I–IV nuolaida konkrečiai datai (0 arba PARTY_WEEKDAY_DISCOUNT_EUR). */
export function partyDiscount(dateStr: string): number {
  return isDiscountDay(dateStr) ? PARTY_WEEKDAY_DISCOUNT_EUR : 0;
}

/** Pasirinktų paketo papildymų suma. */
export function partyExtrasPrice(extraIds: string[]): number {
  return PARTY_EXTRAS.filter((e) => extraIds.includes(e.id)).reduce((s, e) => s + e.price, 0);
}

/** Papildymų pridedama trukmė minutėmis (pvz. „Papildomas laikas"). */
export function partyExtrasDurationDelta(extraIds: string[]): number {
  return PARTY_EXTRAS.filter((e) => extraIds.includes(e.id)).reduce((s, e) => s + e.durationDeltaMin, 0);
}

/** Šventės (paketo) trukmė minutėmis su papildymais — BE buferių. */
export function partyDurationMin(pkg: PartyPackage, extraIds: string[] = []): number {
  return pkg.durationMin + partyExtrasDurationDelta(extraIds);
}

/**
 * Pilnas užimamo laiko langas grafike minutėmis nuo šventės PRADŽIOS laiko:
 * 30 min. prieš (svečiams atvykti) + šventė + 30 min. po (susitvarkyti).
 * Grąžina bendrą span'ą minutėmis.
 */
export function partyBlockSpanMin(pkg: PartyPackage, extraIds: string[] = []): number {
  return BOOKING.partyBufferBeforeMin + partyDurationMin(pkg, extraIds) + BOOKING.partyBufferAfterMin;
}

/** Pilna paketo kaina: bazinė − I–IV nuolaida + papildymai. */
export function partyTotal(pkg: PartyPackage, dateStr: string, extraIds: string[] = []): number {
  return pkg.price - partyDiscount(dateStr) + partyExtrasPrice(extraIds);
}
