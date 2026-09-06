/**
 * Gimtadienio kvietimų PDF generavimas (pdf-lib). TIK serveriui.
 * Sugeneruoja 4 dizainus (A/B/C/D) kaip atskirus PDF, LT arba RU kalba.
 * Kiekvienas = fono „plokštė" (neonas + personažai + logo, be teksto) + tekstas viršuje.
 * Puslapis 559×794 pt (1:1 su drobės maketu; y verčiamas iš viršaus).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { BookingRow } from "@/lib/supabase/server";
import { buildInvitation, invitationPlace, parseInvitationLangs, type InvitationLang } from "./invitation";

const DIR = path.join(process.cwd(), "src", "lib", "booking", "assets");
const W = 559;
const H = 794;

let cache: {
  narrow: Buffer; bold: Buffer; reg: Buffer; poppins: Buffer;
  plates: Record<string, Buffer>;
} | null = null;
async function assets() {
  if (!cache) {
    const [narrow, bold, reg, poppins, a, b, c, d] = await Promise.all([
      readFile(path.join(DIR, "PTSansNarrow-Bold.ttf")),
      readFile(path.join(DIR, "PTSans-Bold.ttf")),
      readFile(path.join(DIR, "PTSans-Regular.ttf")),
      readFile(path.join(DIR, "Poppins-Bold.ttf")),
      readFile(path.join(DIR, "plate-a.jpg")),
      readFile(path.join(DIR, "plate-b.jpg")),
      readFile(path.join(DIR, "plate-c.jpg")),
      readFile(path.join(DIR, "plate-d.jpg")),
    ]);
    cache = { narrow, bold, reg, poppins, plates: { a, b, c, d } };
  }
  return cache;
}

/* Spalvos */
const YELLOW = rgb(1, 0.91, 0.42);
const PINK = rgb(0.98, 0.56, 0.88);
const CYAN = rgb(0.44, 0.9, 1);
const WHITE = rgb(1, 1, 1);
const LAV = rgb(0.85, 0.76, 1);
const SOFT = rgb(0.82, 0.86, 0.96);
const TEAL = rgb(0.302, 0.722, 0.8); // #4db8cc — gimtadienių puslapio „VR" spalva
const INK = rgb(0.14, 0.06, 0.34);
const DARKRED = rgb(0.48, 0.06, 0.25);
const SHADOW = rgb(0.02, 0.01, 0.05);

const MONTHS_LT = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
const MONTHS_RU = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];
const MONTHS_EN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MSHORT_LT = ["saus.","vas.","kovo","bal.","geg.","birž.","liep.","rugp.","rugs.","spal.","lapkr.","gruod."];
const MSHORT_RU = ["янв.","фев.","мар.","апр.","мая","июн.","июл.","авг.","сен.","окт.","ноя.","дек."];
const MSHORT_EN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function dLong(iso: string, lang: InvitationLang) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = lang === "ru" ? MONTHS_RU : lang === "en" ? MONTHS_EN : MONTHS_LT;
  return `${d} ${months[m - 1]} ${y}`;
}
function dShort(iso: string, lang: InvitationLang) {
  const [y, m, d] = iso.split("-").map(Number);
  const months = lang === "ru" ? MSHORT_RU : lang === "en" ? MSHORT_EN : MSHORT_LT;
  return `${d} ${months[m - 1]} ${y}`;
}
function timeRange(b: BookingRow, dots: boolean) {
  const end = b.block_end && b.block_end !== b.time ? b.block_end : null;
  const r = end ? `${b.time}–${end}` : b.time;
  return dots ? r.replace(/:/g, ".") : r;
}

/* Kalbų eilutės */
type L = ReturnType<typeof strings>;
function strings(lang: InvitationLang, age: number | null) {
  const n = age ?? 0;
  if (lang === "en") return {
    tagline: "VIRTUALIOS REALYBĖS ERDVĖ", // brendo šūkis — visada lietuviškai
    invA: "INVITATION", levelA: `LEVEL ${n} REACHED`,
    guest: "PLAYER / BIRTHDAY STAR", levelB: `LEVEL ${n}`,
    lData: "DATE", lTime: "TIME", lPlace: "LOCATION / GATE", lRsvp: "RSVP",
    accessPass: "ACCESS PASS", caption: "BALA VR · KLAIPĖDA · VR PARTY",
    invitedTo: "YOU'RE INVITED TO", badgeSub: "BIRTHDAY",
    dataLabel: "DATE", timeLabel: "TIME",
    invD: "VR BIRTHDAY INVITATION", levelD: `reached level ${n}`,
  };
  if (lang === "ru") return {
    tagline: "VIRTUALIOS REALYBĖS ERDVĖ", // brendo šūkis — visada lietuviškai
    invA: "ПРИГЛАШЕНИЕ", levelA: `${n}-Й УРОВЕНЬ ДОСТИГНУТ`,
    guest: "ИГРОК / ИМЕНИННИК", levelB: `УРОВЕНЬ ${n}`,
    lData: "ДАТА", lTime: "ВРЕМЯ", lPlace: "МЕСТО / ВХОД", lRsvp: "RSVP",
    accessPass: "ACCESS PASS", caption: "BALA VR · КЛАЙПЕДА · VR PARTY",
    invitedTo: "ТЫ ПРИГЛАШЁН НА", badgeSub: "ДЕНЬ РОЖД.",
    dataLabel: "ДАТА", timeLabel: "ВРЕМЯ",
    invD: "ПРИГЛАШЕНИЕ НА VR ДЕНЬ РОЖДЕНИЯ", levelD: `${n}-й уровень достигнут`,
  };
  return {
    tagline: "VIRTUALIOS REALYBĖS ERDVĖ",
    invA: "KVIETIMAS", levelA: `JAU PASIEKĖ ${n} LEVEL'Į`,
    guest: "ŽAIDĖJAS / JUBILIATAS", levelB: `LEVEL ${n} UNLOCKED`,
    lData: "DATA", lTime: "LAIKAS", lPlace: "VIETA / GATE", lRsvp: "RSVP",
    accessPass: "ACCESS PASS", caption: "BALA VR · KLAIPĖDA · VR PARTY",
    invitedTo: "TU PAKVIESTAS Į", badgeSub: "GIMTADIENĮ",
    dataLabel: "DATA", timeLabel: "LAIKAS",
    invD: "KVIETIMAS Į VR GIMTADIENĮ", levelD: `jau pasiekė ${n} level'į`,
  };
}

/* Piešimo pagalbininkai (css top -> baseline) */
function baseY(topCss: number, size: number) { return H - topCss - size * 0.8; }

function drawAt(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color: RGB, glow = true) {
  if (glow) {
    const o = Math.max(0.8, size * 0.03);
    for (const [dx, dy] of [[o, 0], [-o, 0], [0, o], [0, -o]] as const)
      page.drawText(s, { x: x + dx, y: y + dy, size, font, color: SHADOW, opacity: 0.55 });
  }
  page.drawText(s, { x, y, size, font, color });
}
function drawLeft(page: PDFPage, s: string, left: number, top: number, font: PDFFont, size: number, color: RGB, glow = true) {
  drawAt(page, s, left, baseY(top, size), font, size, color, glow);
}
function drawCenter(page: PDFPage, s: string, top: number, font: PDFFont, size: number, color: RGB, glow = true, cx = W / 2) {
  const x = cx - font.widthOfTextAtSize(s, size) / 2;
  drawAt(page, s, x, baseY(top, size), font, size, color, glow);
}
function drawRight(page: PDFPage, s: string, right: number, top: number, font: PDFFont, size: number, color: RGB, glow = true) {
  drawAt(page, s, right - font.widthOfTextAtSize(s, size), baseY(top, size), font, size, color, glow);
}
function wrap(s: string, font: PDFFont, size: number, maxW: number): string[] {
  const words = s.split(/\s+/); const lines: string[] = []; let cur = "";
  for (const w of words) { const t = cur ? `${cur} ${w}` : w; if (font.widthOfTextAtSize(t, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = t; }
  if (cur) lines.push(cur); return lines;
}

type Ctx = { page: PDFPage; disp: PDFFont; bold: PDFFont; reg: PDFFont; poppins: PDFFont; L: L; b: BookingRow; lang: InvitationLang; name: string; body: string; place: string; rsvp: string };

/* ---------- A · Neon Arcade ---------- */
function layoutA(x: Ctx) {
  const { page, disp, reg, bold, poppins, L, b, lang, name, body, rsvp } = x;
  // Logotipas: BALA (balta) + VR (žalsvai mėlyna) — kaip gimtadienių puslapyje
  const ls = 34;
  const wB = poppins.widthOfTextAtSize("BALA", ls);
  const wV = poppins.widthOfTextAtSize("VR", ls);
  const lx = (W - (wB + wV)) / 2;
  const ly = baseY(28, ls);
  page.drawText("BALA", { x: lx, y: ly, size: ls, font: poppins, color: WHITE });
  page.drawText("VR", { x: lx + wB, y: ly, size: ls, font: poppins, color: TEAL });
  // Paantraštė (paryškinta — bold + balta)
  drawCenter(page, L.tagline, 70, bold, 10.5, WHITE, false);

  drawLeft(page, L.invA, 40, 112, disp, 26, CYAN);
  drawLeft(page, name, 38, 150, disp, 74, YELLOW);
  drawLeft(page, L.levelA.split(" ").slice(0, -1).join(" "), 40, 236, disp, 28, PINK);
  drawLeft(page, L.levelA.split(" ").slice(-1)[0], 40, 268, disp, 28, PINK);

  // Kvietimo tekstas — didesnis ir pakeltas (siauresnis, kad nesiektų kardo)
  let y = 380;
  for (const ln of wrap(body, reg, 17, 196)) { drawLeft(page, ln, 40, y, reg, 17, WHITE); y += 23; }
  y += 8;
  page.drawRectangle({ x: 40, y: H - y - 2, width: 78, height: 2, color: TEAL });
  y += 16;
  drawLeft(page, dLong(b.date, lang), 40, y, disp, 22, LAV); y += 30;
  drawLeft(page, timeRange(b, true), 40, y, disp, 26, YELLOW); y += 34;
  const placeL1 = lang === "ru" ? "ТЦ Green Square, Pajūrio g. 5B," : "PC Green Square, Pajūrio g. 5B,";
  const placeL2 = lang === "ru" ? "Клайпеда, 2 этаж" : lang === "en" ? "Klaipėda, 2nd floor" : "Klaipėda, 2 aukštas";
  drawLeft(page, placeL1, 40, y, reg, 12.5, SOFT); y += 17;
  drawLeft(page, placeL2, 40, y, reg, 12.5, SOFT); y += 17;
  y += 6;
  drawLeft(page, `${L.lRsvp}: ${rsvp}`, 40, y, bold, 13.5, CYAN);
}

/* ---------- B · VR Mission Pass ---------- */
function layoutB(x: Ctx) {
  const { page, disp, reg, L, b, lang, name, body, place, rsvp } = x;
  drawCenter(page, L.tagline, 66, reg, 9, WHITE, false);
  // kortelės kairė (card top:118 left:36, vidus left ~62)
  const cl = 62;
  drawLeft(page, L.guest, cl, 146, reg, 10, CYAN, false);
  drawLeft(page, name, cl, 162, disp, 44, YELLOW);
  drawLeft(page, L.levelB, cl, 214, disp, 14, PINK, false);
  let y = 244;
  for (const ln of wrap(body, reg, 15, 210)) { drawLeft(page, ln, cl, y, reg, 15, rgb(0.9,0.93,1), false); y += 22; }
  // laukai apačioje kortelės (kortelė baigiasi bottom:150 => y=644; juosta ~ y 566-644)
  drawLeft(page, L.lData, cl, 574, reg, 10, CYAN, false);
  drawLeft(page, dShort(b.date, lang), cl, 588, disp, 18, LAV, false);
  drawLeft(page, L.lTime, 300, 574, reg, 10, CYAN, false);
  drawLeft(page, timeRange(b, false), 300, 588, disp, 18, YELLOW, false);
  drawLeft(page, L.lPlace, cl, 610, reg, 10, CYAN, false);
  drawLeft(page, place, cl, 625, boldOf(x), 12.5, rgb(0.9,0.93,1), false);
  drawRight(page, `${L.lRsvp}: ${rsvp}`, W - 60, 625, boldOf(x), 12.5, CYAN, false);
  // ACCESS PASS (apačioje, top:741 left:208) + caption
  drawLeft(page, L.accessPass, 214, 745, disp, 11, CYAN, false);
  drawCenter(page, L.caption, 726, reg, 9, rgb(0.54,0.63,0.85), false);
}

/* ---------- C · Comic Poster ---------- */
function layoutC(x: Ctx) {
  const { page, disp, reg, L, b, lang, name, body, place, rsvp } = x;
  drawCenter(page, L.tagline, 60, reg, 10, WHITE, false);
  drawCenter(page, L.invitedTo, 96, disp, 26, CYAN);
  drawCenter(page, name, 128, disp, 92, YELLOW);
  // badge (right:28 top:236 w124 -> centras ~ x 469, y 298)
  const bx = 469;
  drawCenter(page, String(x.b.celebrant_age ?? ""), 268, disp, 44, WHITE, true, bx);
  drawCenter(page, L.badgeSub, 316, disp, 13, WHITE, true, bx);
  // kalbos burbulas (right:32 top:398 w224 -> vidus left ~ 561-32-224+20=325? burbulo kairė = W-32-224=303, +20 padding=323)
  let y = 420;
  for (const ln of wrap(body, boldOf(x), 15.5, 190)) { drawLeft(page, ln, 322, y, boldOf(x), 15.5, INK, false); y += 21; }
  // geltona juosta (bottom:100 -> viršus ~ y 640; DATA kairė ~ x 110, LAIKAS ~ x 330)
  drawLeft(page, L.dataLabel, 110, 648, boldOf(x), 14, DARKRED, false);
  drawLeft(page, dShort(b.date, lang).toUpperCase(), 110, 664, disp, 25, INK, false);
  drawLeft(page, L.timeLabel, 340, 648, boldOf(x), 14, DARKRED, false);
  drawLeft(page, timeRange(b, true), 340, 664, disp, 25, INK, false);
  // vieta + RSVP (bottom:36)
  drawLeft(page, place, 26, 726, boldOf(x), 13, rgb(0.9,0.87,1), true);
  drawLeft(page, `${L.lRsvp}: ${rsvp}`, 26, 744, boldOf(x), 13, CYAN, true);
}

/* ---------- D · Abu herojai ---------- */
function layoutD(x: Ctx) {
  const { page, disp, reg, L, b, lang, name, body, place, rsvp } = x;
  drawCenter(page, L.tagline, 62, reg, 10, WHITE, false);
  drawCenter(page, L.invD, 86, reg, 12, CYAN);
  drawCenter(page, name, 104, disp, 70, YELLOW);
  drawCenter(page, L.levelD, 178, disp, 25, PINK);
  let y = 210;
  for (const ln of wrap(body, reg, 15, 400)) { drawCenter(page, ln, y, reg, 15, WHITE); y += 21; }
  // apatinė juosta (bottom:0 height132 -> y 662..794, centruota)
  drawCenter(page, `${dLong(b.date, lang)}     ${timeRange(b, true)}`, 684, disp, 22, LAV);
  drawCenter(page, place, 720, reg, 12.5, SOFT, false);
  drawCenter(page, `${L.lRsvp}: ${rsvp}`, 742, boldOf(x), 13.5, CYAN);
}

function boldOf(x: Ctx) { return x.bold; }

const DESIGNS: Record<string, (x: Ctx) => void> = { a: layoutA, b: layoutB, c: layoutC, d: layoutD };

/**
 * Sugeneruoja kvietimo PDF (naudojamas tik A dizainas). Kalba iš rezervacijos:
 * "lt"/"ru" -> 1 PDF; "both" -> 2 PDF (LT + RU). Grąžina [{filename, bytes}].
 */
export async function generateInvitationPdfs(
  b: BookingRow,
): Promise<{ filename: string; bytes: Uint8Array }[]> {
  if (!b.invitation_type) return [];
  const { narrow, bold, reg, poppins, plates } = await assets();
  // Palaikom seną "both" reikšmę + naują kelių kalbų sąrašą ("lt,ru,en").
  const parsed = b.invitation_lang === "both" ? (["lt", "ru"] as InvitationLang[]) : parseInvitationLangs(b.invitation_lang);
  const langs: InvitationLang[] = parsed.length ? parsed : ["lt"];
  const name = (b.celebrant_name ?? "").toUpperCase();
  const rsvp = b.customer_phone;
  const key = "a" as const;

  const out: { filename: string; bytes: Uint8Array }[] = [];
  for (const lang of langs) {
    const L = strings(lang, b.celebrant_age);
    const body = buildInvitation({ type: "personalized", lang, celebrantName: b.celebrant_name, celebrantAge: b.celebrant_age }).body;
    const place = invitationPlace(lang);
    const doc = await PDFDocument.create();
    doc.registerFontkit(fontkit);
    const disp = await doc.embedFont(narrow, { subset: true });
    const fbold = await doc.embedFont(bold, { subset: true });
    const freg = await doc.embedFont(reg, { subset: true });
    const fpop = await doc.embedFont(poppins, { subset: true });
    const page = doc.addPage([W, H]);
    const plate = await doc.embedJpg(plates[key]);
    page.drawImage(plate, { x: 0, y: 0, width: W, height: H });
    DESIGNS[key]({ page, disp, bold: fbold, reg: freg, poppins: fpop, L, b, lang, name, body, place, rsvp });
    const bytes = await doc.save();
    const suffix = langs.length > 1 ? `-${lang.toUpperCase()}` : "";
    out.push({ filename: `BALA-VR-gimtadienio-kvietimas${suffix}.pdf`, bytes });
  }
  return out;
}
