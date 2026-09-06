/**
 * Dovanų kupono PDF generavimas (pdf-lib + įsiūti šriftai). TIK serveriui.
 * A5 gulsčias, ŠVIESUS (spausdinimui tinkamas) dizainas: kreminis fonas,
 * Drakonų bokšto drakono plakatas kaip iliustracija kairėje.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { VoucherRow } from "@/lib/supabase/server";
import { formatEur } from "@/lib/booking/pricing";

const ASSET_DIR = path.join(process.cwd(), "src", "lib", "voucher", "assets");

// Failai skaitomi vieną kartą ir laikomi atmintyje (šilto starto optimizacija).
let cache: { anton: Buffer; archivo: Buffer; dragon: Buffer } | null = null;
async function assets() {
  if (!cache) {
    const [anton, archivo, dragon] = await Promise.all([
      readFile(path.join(ASSET_DIR, "Anton-Regular.ttf")),
      readFile(path.join(ASSET_DIR, "Archivo.ttf")),
      readFile(path.join(ASSET_DIR, "dragon-tower.jpg")),
    ]);
    cache = { anton, archivo, dragon };
  }
  return cache;
}

/* Šviesios temos spalvos (spausdinimui) */
const CREAM = rgb(0.980, 0.961, 0.925); // #FAF5EC fonas
const SHADOW = rgb(0.859, 0.820, 0.749); // plakato šešėlis
const INK = rgb(0.106, 0.078, 0.051); // #1B1409 pagrindinis tekstas
const DRAGON = rgb(0.746, 0.216, 0.118); // #BE371E drakoniška raudona
const GOLD = rgb(0.941, 0.706, 0.161); // #F0B429 kodo blokas
const GOLD_INK = rgb(0.157, 0.098, 0); // #281900 tekstas ant aukso
const GRAY = rgb(0.42, 0.36, 0.30); // šiltas pilkas
const GRAY_2 = rgb(0.55, 0.49, 0.42); // šviesesnis pilkas
const PURPLE = rgb(0.43, 0.16, 0.85); // #6D28D9 „VR"
const HAIR = rgb(0.85, 0.81, 0.74); // plonos linijos

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Sugeneruoja kupono PDF baitus. */
export async function generateVoucherPdf(v: VoucherRow): Promise<Uint8Array> {
  const { anton, archivo, dragon } = await assets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const display = await doc.embedFont(anton, { subset: true });
  const body = await doc.embedFont(archivo, { subset: true });
  const dragonImg = await doc.embedJpg(dragon);

  // A5 gulsčias (taškais)
  const W = 595.28;
  const H = 419.53;
  const page = doc.addPage([W, H]);

  /* Tekstas centruotas apie duotą x (su nebūtinu raidžių tarpu). */
  const drawCenteredAt = (cx: number, text: string, y: number, font: PDFFont, size: number, color: RGB, spacing = 0) => {
    if (spacing > 0) {
      let total = 0;
      for (const ch of text) total += font.widthOfTextAtSize(ch, size) + spacing;
      total -= spacing;
      let x = cx - total / 2;
      for (const ch of text) {
        page.drawText(ch, { x, y, size, font, color });
        x += font.widthOfTextAtSize(ch, size) + spacing;
      }
    } else {
      const w = font.widthOfTextAtSize(text, size);
      page.drawText(text, { x: cx - w / 2, y, size, font, color });
    }
  };

  /* ---------- Fonas ---------- */
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: CREAM });
  // Ploni pjovimo/rėmo kraštai (spausdinimui)
  const frame = 13;
  page.drawRectangle({
    x: frame, y: frame, width: W - 2 * frame, height: H - 2 * frame,
    borderColor: HAIR, borderWidth: 0.8, opacity: 0,
  });

  /* ---------- Drakono plakatas (kairė kortelė) ---------- */
  const margin = 26;
  const imgH = H - 2 * margin;
  const imgW = imgH * (dragonImg.width / dragonImg.height);
  const imgX = margin;
  const imgY = margin;
  // šešėlis
  page.drawRectangle({ x: imgX + 4, y: imgY - 4, width: imgW, height: imgH, color: SHADOW });
  // plakatas
  page.drawImage(dragonImg, { x: imgX, y: imgY, width: imgW, height: imgH });
  // plonas rėmelis
  page.drawRectangle({ x: imgX, y: imgY, width: imgW, height: imgH, borderColor: INK, borderWidth: 1, opacity: 0 });

  /* ---------- Dešinioji turinio kolonėlė ---------- */
  const contentX = imgX + imgW + 30;
  const rightEdge = W - 30;
  const colW = rightEdge - contentX;
  const cx = contentX + colW / 2;

  // Wordmark „BALA VR" (tekstu — logotipas baltas, netiktų šviesiam fonui)
  const wmSize = 21;
  const wBala = display.widthOfTextAtSize("BALA", wmSize);
  const gap = 5;
  const wVR = display.widthOfTextAtSize("VR", wmSize);
  const wmTotal = wBala + gap + wVR;
  const wmX = cx - wmTotal / 2;
  page.drawText("BALA", { x: wmX, y: H - 46, size: wmSize, font: display, color: INK });
  page.drawText("VR", { x: wmX + wBala + gap, y: H - 46, size: wmSize, font: display, color: PURPLE });

  drawCenteredAt(cx, "VIRTUALIOS REALYBĖS ERDVĖ · KLAIPĖDA", H - 62, body, 7, GRAY_2, 1.3);

  // Antraštė — stambi, dviem eilutėm (be brūkšnio)
  drawCenteredAt(cx, "DOVANŲ", H - 106, display, 40, DRAGON, 0.5);
  drawCenteredAt(cx, "KUPONAS", H - 144, display, 40, DRAGON, 0.5);

  // Vertė
  const value = `${formatEur(Number(v.amount_eur))} €`;
  drawCenteredAt(cx, value, H - 202, display, 46, INK);

  // Personalizacija (jei yra)
  let cursorY = H - 228;
  const personal: string[] = [];
  if (v.recipient_name) personal.push(`Kam: ${v.recipient_name}`);
  if (v.from_name) personal.push(`Nuo: ${v.from_name}`);
  if (personal.length) {
    drawCenteredAt(cx, personal.join("     "), cursorY, body, 10.5, GRAY);
    cursorY -= 17;
  }
  if (v.message) {
    const msg = v.message.length > 64 ? v.message.slice(0, 62) + "…" : v.message;
    drawCenteredAt(cx, `„${msg}"`, cursorY, body, 9.5, GRAY_2);
  }

  // Kodo blokas (auksinis fonas, tamsus tekstas) — dinamiškai talpinamas
  const code = v.code ?? "—";
  let codeSize = 20;
  while (codeSize > 12 && display.widthOfTextAtSize(code, codeSize) + 34 > colW - 6) codeSize--;
  const codeW = display.widthOfTextAtSize(code, codeSize);
  const boxW = codeW + 34;
  const boxH = 40;
  const boxX = cx - boxW / 2;
  const boxY = 92;
  page.drawText("KODAS", { x: cx - body.widthOfTextAtSize("KODAS", 8) / 2, y: boxY + boxH + 6, size: 8, font: body, color: GRAY_2 });
  page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: GOLD });
  page.drawText(code, { x: cx - codeW / 2, y: boxY + (boxH - codeSize) / 2 + 2, size: codeSize, font: display, color: GOLD_INK });

  // Galiojimas
  if (v.valid_until) {
    drawCenteredAt(cx, `Galioja iki ${fmtDate(v.valid_until)}`, 74, body, 9, GRAY);
  }

  // Skirtukas
  page.drawRectangle({ x: contentX + 14, y: 62, width: colW - 28, height: 0.8, color: HAIR });

  // Kaip panaudoti + kontaktai
  drawCenteredAt(cx, "Kodą nurodykite rezervuodami bala-web-roan.vercel.app arba pateikite atvykę.", 46, body, 6.6, GRAY_2);
  drawCenteredAt(cx, "BALA VR · Pajūrio g. 5B, Klaipėda · +370 684 26686", 32, body, 6.6, GRAY_2);

  return doc.save();
}
