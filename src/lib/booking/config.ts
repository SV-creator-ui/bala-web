/**
 * Rezervacijos sistemos konfigūracija — VIENAS TIESOS ŠALTINIS.
 * Naudojama ir kliento pusėje (BookingFlow), ir serveryje (API route'ai).
 * Čia keiskite darbo valandas, kainas, avansą ir pan.
 */

export const BOOKING = {
  /** Darbo pradžia (valanda, 24h formatu) */
  openHour: 12,
  /** Paskutinio seanso PRADŽIOS valanda (imtinai) */
  closeHour: 21,
  /**
   * Kada patalpa realiai užsidaro (valanda). Iki šio laiko turi tilpti visas
   * užimtas rezervacijos langas (įskaitant kambario trukmę ar paketo buferius).
   * Pvz. kambarys, pradėtas 21:00, trunka 60 min. ir baigiasi 22:00.
   */
  closeEndHour: 22,
  /** Seansų (pradžios laikų) intervalas minutėmis */
  slotStepMin: 30,

  /** Kiek minučių grafike užima ĮPRASTAS VR pabėgimo kambario apsilankymas */
  roomDurationMin: 60,

  /** Gimtadienio/šventės paketas: buferis PRIEŠ (svečiams atvykti), minutėmis */
  partyBufferBeforeMin: 30,
  /** Gimtadienio/šventės paketas: buferis PO (susitvarkyti), minutėmis */
  partyBufferAfterMin: 30,

  /** Mažiausias žaidėjų skaičius įprastam apsilankymui */
  minPlayers: 2,
  /** Didžiausias žaidėjų skaičius įprastam apsilankymui */
  maxPlayers: 10,

  /** Įprasto apsilankymo avansas eurais */
  depositEur: 30,
  /** Gimtadienio/šventės paketo avansas eurais */
  depositPartyEur: 50,

  /** Kiek grupių gali žaisti tuo pačiu metu (1 = vienas seansas vienu metu) */
  slotCapacity: 1,
  /** Kiek minučių laikoma "pending" rezervacija, kol nesumokėtas avansas */
  pendingHoldMin: 30,
  currency: "EUR" as const,
  locale: "lt" as const,
} as const;

/** Rezervacijos tipas */
export type BookingType = "room" | "party";

/** Avansas pagal rezervacijos tipą */
export function depositFor(type: BookingType): number {
  return type === "party" ? BOOKING.depositPartyEur : BOOKING.depositEur;
}

/* ------------------------- Laiko pagalbinės ------------------------- */

/** "14:30" -> 870 (minutės nuo paros pradžios) */
export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

/** 870 -> "14:30" */
export function toHHMM(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Darbo lango pradžia/pabaiga minutėmis */
export const dayStartMin = BOOKING.openHour * 60;
export const dayEndMin = BOOKING.closeEndHour * 60;

/** Sugeneruoja visų galimų PRADŽIOS laikų sąrašą, pvz. ["12:00",...,"21:00"] */
export function generateSlots(): string[] {
  const slots: string[] = [];
  for (let m = BOOKING.openHour * 60; m <= BOOKING.closeHour * 60; m += BOOKING.slotStepMin) {
    slots.push(toHHMM(m));
  }
  return slots;
}

/**
 * Papildomos paslaugos ĮPRASTAM apsilankymui.
 * TUŠČIA pagal nutylėjimą. Paketų papildymai gyvena atskirai — žr. packages.ts.
 */
export type Addon = { id: string; name: string; desc: string; price: number };
export const ADDONS: readonly Addon[] = [];
