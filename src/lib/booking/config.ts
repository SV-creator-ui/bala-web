/**
 * Rezervacijos sistemos konfigūracija — VIENAS TIESOS ŠALTINIS.
 * Naudojama ir kliento pusėje (BookingFlow), ir serveryje (API route'ai).
 * Čia keiskite darbo valandas, kainas, avansą ir pan.
 */

export const BOOKING = {
  /** Seansų (pradžios laikų) intervalas minutėmis */
  slotStepMin: 30,

  /** Kiek minučių grafike užima ĮPRASTAS VR pabėgimo kambario apsilankymas */
  roomDurationMin: 60,

  /** Gimtadienio/šventės paketas: buferis PRIEŠ (svečiams atvykti / pasiruošti), minutėmis.
   *  Naudojamas ir kaip BŪTINAS tarpas prieš bet kokią šventę grafike. */
  partyBufferBeforeMin: 30,
  /** Gimtadienio/šventės paketas: buferis PO (susitvarkyti), minutėmis.
   *  DĖMESIO: grafike nebenaudojamas — tarpą po šventės nustato kitas užsakymas
   *  (žr. partyToNormalGapMin ir window.ts → requiredGapMin). Paliktas informacijai. */
  partyBufferAfterMin: 30,
  /** Būtinas tarpas grafike PO šventės, kai po jos eina ĮPRASTAS užsakymas
   *  (pabėgimo kambarys / komandiniai žaidimai) — kambariui susitvarkyti. Minutėmis. */
  partyToNormalGapMin: 15,

  /** Mažiausias žaidėjų skaičius įprastam apsilankymui */
  minPlayers: 2,
  /** Didžiausias žaidėjų skaičius įprastam apsilankymui (fizinė talpa) */
  maxPlayers: 10,
  /** Didžiausias žaidėjų skaičius, kurį galima rezervuoti INTERNETU.
   *  Didesnėms grupėms (nuo maxOnlinePlayers+1 iki maxPlayers) rezervacija
   *  vyksta telefonu — žr. BookingFlow (StepPlayers) ir API validaciją. */
  maxOnlinePlayers: 6,

  /** Įprasto apsilankymo avansas eurais */
  depositEur: 30,
  /** Gimtadienio/šventės paketo avansas eurais */
  depositPartyEur: 50,

  /** Kiek grupių gali žaisti tuo pačiu metu (1 = vienas seansas vienu metu) */
  slotCapacity: 1,
  /** Kiek minučių laikoma "pending" rezervacija, kol nesumokėtas avansas */
  pendingHoldMin: 30,
  /**
   * Mažiausias išankstinis laikas iki seanso pradžios (minutėmis). Šiandienos
   * dienai laikai, prasidedantys anksčiau nei „dabar + tiek", neberodomi.
   */
  bookingLeadMin: 60,
  currency: "EUR" as const,
  locale: "lt" as const,
} as const;

/** Įstaigos laiko juosta (serveris Vercel'e veikia UTC, todėl skaičiuojame aiškiai). */
export const TIMEZONE = "Europe/Vilnius";

/**
 * Dabartinė data ir laikas įstaigos laiko juostoje.
 * Grąžina { date: "YYYY-MM-DD", min: minutės nuo paros pradžios }.
 */
export function venueNow(now: Date = new Date()): { date: string; min: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  // hour12:false kartais grąžina "24" vidurnaktį — normalizuojame į 0.
  const hh = Number(get("hour")) % 24;
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    min: hh * 60 + Number(get("minute")),
  };
}

/** Rezervacijos tipas: pabėgimo kambarys / šventės paketas / komandiniai žaidimai */
export type BookingType = "room" | "party" | "game";

/** Avansas pagal rezervacijos tipą (game ir room — vienodas) */
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

/* ------------------------- Darbo valandos ------------------------- */
/**
 * Darbo valandos pagal savaitės dieną (getDay(): 0=Sk … 6=Št).
 *   Penktadienis (5) + savaitgalis (Št 6, Sk 0): 10:00–21:30.
 *   Pirmadienis–ketvirtadienis (1–4):            11:00–20:30.
 * `openMin` — atidarymas; `closeEndMin` — iki kada turi tilpti visas užimtas
 * langas (įskaitant kambario trukmę ar paketo buferius).
 */
export type DayHours = { openMin: number; closeEndMin: number };
export function dayHours(dateStr: string): DayHours {
  const wd = new Date(dateStr + "T00:00:00").getDay();
  const earlyOpen = wd === 5 || wd === 6 || wd === 0;
  return earlyOpen
    ? { openMin: 10 * 60, closeEndMin: 21 * 60 + 30 }
    : { openMin: 11 * 60, closeEndMin: 20 * 60 + 30 };
}

/** Atidarymo laikas (min.), nuo kurio galioja „rytinės apsaugos" taisyklė */
export const EARLY_OPEN_MIN = 10 * 60;
/**
 * Kai diena atidaroma 10 val. — ŠVENTĖS (party) pradžia negalima šiais laikais,
 * kad rytinis 10:00 langas neliktų tuščias. Kambariams (room) NETAIKOMA.
 */
export const PARTY_BLOCKED_STARTS_EARLY = new Set(["11:30", "12:00", "12:30"]);

/** Dienos slotų ribos: atidarymas, uždarymas ir paskutinis PRADŽIOS laikas. */
export function slotRangeForDate(dateStr: string): { openMin: number; closeEndMin: number; lastStartMin: number } {
  const { openMin, closeEndMin } = dayHours(dateStr);
  // Paskutinis pradžios laikas = kad tilptų bent trumpiausia rezervacija (kambarys).
  return { openMin, closeEndMin, lastStartMin: closeEndMin - BOOKING.roomDurationMin };
}

/** Konkrečios dienos galimi PRADŽIOS laikai. */
export function generateSlotsForDate(dateStr: string): string[] {
  const { openMin, lastStartMin } = slotRangeForDate(dateStr);
  const slots: string[] = [];
  for (let m = openMin; m <= lastStartMin; m += BOOKING.slotStepMin) slots.push(toHHMM(m));
  return slots;
}

/**
 * Platus laikų sąrašas (visų dienų sąjunga) — naudojamas TIK admin blackout
 * pasirinkimui. Realiam laisvumui naudokite generateSlotsForDate(date).
 */
export function generateSlots(): string[] {
  const slots: string[] = [];
  for (let m = 10 * 60; m <= 21 * 60; m += BOOKING.slotStepMin) slots.push(toHHMM(m));
  return slots;
}

/**
 * Papildomos paslaugos ĮPRASTAM apsilankymui.
 * TUŠČIA pagal nutylėjimą. Paketų papildymai gyvena atskirai — žr. packages.ts.
 */
export type Addon = { id: string; name: string; desc: string; price: number };
export const ADDONS: readonly Addon[] = [];
