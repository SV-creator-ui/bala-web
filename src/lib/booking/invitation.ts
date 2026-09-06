/**
 * Gimtadienio kvietimo turinys ir validacija (LT / RU, personalizuotas / paprastas).
 * GRYNAS modulis — jokių node priklausomybių, kad galėtų importuoti ir klientas
 * (BookingFlow peržiūra), ir serveris (PDF + el. laiškas).
 */

export type InvitationType = "personalized" | "plain";
export type InvitationLang = "lt" | "ru" | "en";
export const ALL_INVITATION_LANGS: InvitationLang[] = ["lt", "ru", "en"];

export function validInvitationType(v: unknown): v is InvitationType {
  return v === "personalized" || v === "plain";
}
export function validInvitationLang(v: unknown): v is InvitationLang {
  return v === "lt" || v === "ru" || v === "en";
}
/**
 * Kelios kvietimo kalbos: iš string ("lt,ru,en") arba masyvo grąžina unikalų
 * galiojantį sąrašą kanonine tvarka. Kiekvienai kalbai — po atskirą kvietimą.
 */
export function parseInvitationLangs(v: unknown): InvitationLang[] {
  const raw = Array.isArray(v) ? v : typeof v === "string" ? v.split(",") : [];
  const set = new Set(raw.map((s) => String(s).trim()));
  return ALL_INVITATION_LANGS.filter((l) => set.has(l));
}
/** Jubiliato amžius: sveikas 1–99. */
export function validCelebrantAge(v: unknown): v is number {
  return Number.isInteger(v) && (v as number) >= 1 && (v as number) <= 99;
}

const MONTHS_LT = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
const MONTHS_RU = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];

/** "11 kovo 2027" / "11 марта 2027" / "11 March 2027" iš ISO datos (YYYY-MM-DD). */
export function fmtDateLang(iso: string, lang: InvitationLang): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = lang === "ru" ? MONTHS_RU : lang === "en" ? MONTHS_EN : MONTHS_LT;
  return `${d} ${months[m - 1]} ${y}`;
}

/** Vieta (adresas) pagal kalbą. */
export function invitationPlace(lang: InvitationLang): string {
  if (lang === "ru") return "ТЦ Green Square, Pajūrio g. 5B, Клайпеда, 2 этаж";
  if (lang === "en") return "PC Green Square, Pajūrio g. 5B, Klaipėda, 2nd floor";
  return "PC Green Square, Pajūrio g. 5B, Klaipėda, 2 aukštas";
}

export type InvitationContent = {
  eyebrow: string;
  title: string; // didelė antraštė (jubiliato vardas arba bendrinis pavadinimas)
  levelLine: string | null; // tik personalizuotas
  body: string;
  labels: { date: string; time: string; place: string; phone: string };
  showPhone: boolean;
};

/**
 * Sukonstruoja kvietimo tekstus (be konkrečių datos/laiko/tel. reikšmių —
 * jos įrašomos atvaizduojant iš rezervacijos duomenų).
 */
export function buildInvitation(opts: {
  type: InvitationType;
  lang: InvitationLang;
  celebrantName?: string | null;
  celebrantAge?: number | null;
}): InvitationContent {
  const { type, lang } = opts;
  const name = (opts.celebrantName ?? "").trim();
  const age = opts.celebrantAge ?? null;

  const labels =
    lang === "ru"
      ? { date: "Дата", time: "Время", place: "Место", phone: "Тел." }
      : lang === "en"
      ? { date: "Date", time: "Time", place: "Location", phone: "Phone" }
      : { date: "Data", time: "Laikas", place: "Vieta", phone: "Tel." };

  if (type === "personalized") {
    if (lang === "ru") {
      return {
        eyebrow: "ПРИГЛАШЕНИЕ НА ДЕНЬ РОЖДЕНИЯ",
        title: name || "ДЕНЬ РОЖДЕНИЯ",
        levelLine: age != null ? `${age}-й уровень достигнут` : null,
        body: "Приглашаю тебя на свой праздник — тебя ждут приключения в виртуальной реальности!",
        labels,
        showPhone: true,
      };
    }
    if (lang === "en") {
      return {
        eyebrow: "BIRTHDAY INVITATION",
        title: name || "BIRTHDAY PARTY",
        levelLine: age != null ? `reached level ${age}` : null,
        body: "I invite you to my birthday party — adventures in virtual reality await!",
        labels,
        showPhone: true,
      };
    }
    return {
      eyebrow: "KVIETIMAS Į GIMTADIENĮ",
      title: name || "GIMTADIENIO ŠVENTĖ",
      levelLine: age != null ? `jau pasiekė ${age} level'į` : null,
      body: "Kviečiu tave į savo gimtadienio šventę — laukia nuotykiai virtualioje realybėje!",
      labels,
      showPhone: true,
    };
  }

  // plain
  if (lang === "ru") {
    return {
      eyebrow: "ПРИГЛАШЕНИЕ", title: "ДЕНЬ РОЖДЕНИЯ", levelLine: null,
      body: "Приглашаю тебя на свой день рождения!", labels, showPhone: false,
    };
  }
  if (lang === "en") {
    return {
      eyebrow: "INVITATION", title: "BIRTHDAY PARTY", levelLine: null,
      body: "I invite you to my birthday party!", labels, showPhone: false,
    };
  }
  return {
    eyebrow: "KVIETIMAS", title: "GIMTADIENIO ŠVENTĖ", levelLine: null,
    body: "Kviečiu Tave į savo gimtadienio šventę!", labels, showPhone: false,
  };
}
