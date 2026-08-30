/**
 * Formos validacija — naudojama kliento pusėje (gyvas tikrinimas) IR
 * serveryje (kad niekas neapeitų per API).
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;
const NAME_LETTER_RE = /[A-Za-zÀ-žĄ-ųČčĘęĖėĮįŠšŲųŪūŽž]/g;

/** Vardas — bent 3 raidės */
export function validName(raw: string): boolean {
  const v = raw.trim();
  return v.length >= 3 && (v.match(NAME_LETTER_RE) || []).length >= 3;
}

/** Lietuviškas telefonas: +370 / 8 / 0 + 8 skaitmenys (leidžiami tarpai, brūkšneliai) */
export function validPhone(raw: string): boolean {
  const v = raw.trim().replace(/[\s()\-]/g, "");
  return (
    /^\+3706\d{7}$/.test(v) ||
    /^86\d{7}$/.test(v) ||
    /^06\d{7}$/.test(v) ||
    /^\+370\d{8}$/.test(v)
  );
}

/** El. pašto formatas */
export function validEmail(raw: string): boolean {
  return EMAIL_RE.test(raw.trim());
}

/** Data formatu YYYY-MM-DD, ne praeityje (pagal serverio laiką) */
export function validFutureDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d.getTime() >= today.getTime();
}
