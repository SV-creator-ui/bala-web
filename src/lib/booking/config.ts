/**
 * Rezervacijos sistemos konfigūracija — VIENAS TIESOS ŠALTINIS.
 * Naudojama ir kliento pusėje (BookingFlow), ir serveryje (API route'ai).
 * Čia keiskite darbo valandas, kainas, avansą ir pan.
 */

export const BOOKING = {
  /** Darbo pradžia (valanda, 24h formatu) */
  openHour: 12,
  /** Paskutinio seanso valanda (imtinai) */
  closeHour: 21,
  /** Seansų intervalas minutėmis */
  slotStepMin: 30,
  /** Mažiausias žaidėjų skaičius */
  minPlayers: 2,
  /** Didžiausias žaidėjų skaičius */
  maxPlayers: 10,
  /** Fiksuotas avansas eurais, sumokamas internetu */
  depositEur: 30,
  /** Kiek grupių gali žaisti tuo pačiu metu (1 = vienas seansas vienu metu) */
  slotCapacity: 1,
  /** Kiek minučių laikoma "pending" rezervacija, kol nesumokėtas avansas */
  pendingHoldMin: 30,
  currency: "EUR" as const,
  locale: "lt" as const,
} as const;

/** Sugeneruoja visų seansų laikus, pvz. ["12:00","12:30",...,"21:00"] */
export function generateSlots(): string[] {
  const slots: string[] = [];
  for (let m = BOOKING.openHour * 60; m <= BOOKING.closeHour * 60; m += BOOKING.slotStepMin) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return slots;
}

/**
 * Papildomos paslaugos.
 * TUŠČIA pagal nutylėjimą — realiame bala-web puslapyje priedų nėra.
 * Kai patvirtinsite realius priedus ir kainas, įrašykite čia ir jie
 * automatiškai atsiras rezervacijos sraute (2 žingsnis).
 * Pavyzdys:
 *   { id: "photos", name: "Nuotraukų paketas", desc: "...", price: 15 },
 */
export type Addon = { id: string; name: string; desc: string; price: number };
export const ADDONS: readonly Addon[] = [];
