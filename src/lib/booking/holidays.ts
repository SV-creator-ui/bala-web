/**
 * Lietuvos valstybinės (ne darbo) šventės.
 * - Valstybinės šventės: gimtadienių I–IV nuolaida NEtaikoma (net jei tai
 *   pirmadienis–ketvirtadienis).
 * - Kalėdų dienos (gruodžio 24–26): patalpa UŽDARYTA — jokių rezervacijų.
 *
 * Veikia bet kuriais metais (Velykos skaičiuojamos algoritmu).
 */

/** Velykų sekmadienio data konkretiems metams (Meeus/Jones/Butcher). */
function easterSunday(year: number): { month: number; day: number } {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = kovas, 4 = balandis
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return { month, day };
}

/** Fiksuotos datos valstybinės šventės ("MM-DD"). */
const FIXED_HOLIDAYS = new Set<string>([
  "01-01", // Naujieji metai
  "02-16", // Valstybės atkūrimo diena
  "03-11", // Nepriklausomybės atkūrimo diena
  "05-01", // Tarptautinė darbo diena
  "06-24", // Joninės (Rasos)
  "07-06", // Valstybės (Karaliaus Mindaugo karūnavimo) diena
  "08-15", // Žolinė
  "11-01", // Visų šventųjų diena
  "11-02", // Vėlinės
  "12-24", // Kūčios
  "12-25", // Šv. Kalėdos
  "12-26", // Antra Kalėdų diena
]);

/** Kalėdų dienos, kai patalpa uždaryta. */
const CLOSED_HOLIDAYS = new Set<string>(["12-24", "12-25", "12-26"]);

function mmdd(dateStr: string): string {
  const [, m, d] = dateStr.split("-");
  return `${m}-${d}`;
}

/** Ar data (YYYY-MM-DD) yra Lietuvos valstybinė šventė? */
export function isPublicHoliday(dateStr: string): boolean {
  const key = mmdd(dateStr);
  if (FIXED_HOLIDAYS.has(key)) return true;

  // Velykos (sekmadienis) ir antra Velykų diena (pirmadienis).
  const year = Number(dateStr.slice(0, 4));
  const es = easterSunday(year);
  const pad = (n: number) => String(n).padStart(2, "0");
  const esKey = `${pad(es.month)}-${pad(es.day)}`;
  const em = new Date(Date.UTC(year, es.month - 1, es.day + 1));
  const emKey = `${pad(em.getUTCMonth() + 1)}-${pad(em.getUTCDate())}`;
  return key === esKey || key === emKey;
}

/** Ar data — Kalėdų diena, kai patalpa uždaryta (jokių rezervacijų)? */
export function isClosedHoliday(dateStr: string): boolean {
  return CLOSED_HOLIDAYS.has(mmdd(dateStr));
}
