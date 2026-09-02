/**
 * Dovanų kupono PDF generavimas (pdf-lib + įsiūti šriftai). TIK serveriui.
 * A5 gulsčias, BALA VR brendo stilius (juodas fonas, „volt" geltona).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, rgb, type PDFFont, type PDFPage, type RGB } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import type { VoucherRow } from "@/lib/supabase/server";
import { formatEur } from "@/lib/booking/pricing";

const ASSET_DIR = path.join(process.cwd(), "src", "lib", "voucher", "assets");

// Failai skaitomi vieną kartą ir laikomi atmintyje (šilto starto optimizacija).
let cache: { anton: Buffer; archivo: Buffer; logo: Buffer } | null = null;
async function assets() {
  if (!cache) {
    const [anton, archivo, logo] = await Promise.all([
      readFile(path.join(ASSET_DIR, "Anton-Regular.ttf")),
      readFile(path.join(ASSET_DIR, "Archivo.ttf")),
      readFile(path.join(ASSET_DIR, "logo-wordmark.png")),
    ]);
    cache = { anton, archivo, logo };
  }
  return cache;
}

/* Brendo spalvos */
const INK = rgb(0.043, 0.043, 0.043); // #0B0B0B
const INK_CARD = rgb(0.102, 0.102, 0.102); // #1A1A1A
const VOLT = rgb(1, 0.894, 0); // #FFE400
const VOLT_INK = rgb(0.086, 0.071, 0); // #161200
const WHITE = rgb(1, 1, 1);
const SMOKE = rgb(0.72, 0.72, 0.72);
const SMOKE_2 = rgb(0.55, 0.55, 0.55);

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function centerX(page: PDFPage, text: string, font: PDFFont, size: number): number {
  return (page.getWidth() - font.widthOfTextAtSize(text, size)) / 2;
}

/** Sugeneruoja kupono PDF baitus. */
export async function generateVoucherPdf(v: VoucherRow): Promise<Uint8Array> {
  const { anton, archivo, logo } = await assets();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const display = await doc.embedFont(anton, { subset: true });
  const body = await doc.embedFont(archivo, { subset: true });
  const logoImg = await doc.embedPng(logo);

  // A5 gulsčias (taškais)
  const W = 595.28;
  const H = 419.53;
  const page = doc.addPage([W, H]);

  const drawCenter = (text: string, y: number, font: PDFFont, size: number, color: RGB, spacing = 0) => {
    if (spacing > 0) {
      // rankinis raidžių tarpas (tracking) — antraštėms
      let total = 0;
      for (const ch of text) total += font.widthOfTextAtSize(ch, size) + spacing;
      total -= spacing;
      let x = (W - total) / 2;
      for (const ch of text) {
        page.drawText(ch, { x, y, size, font, color });
        x += font.widthOfTextAtSize(ch, size) + spacing;
      }
    } else {
      page.drawText(text, { x: centerX(page, text, font, size), y, size, font, color });
    }
  };

  // Fonas
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: INK });
  // Vidinis rėmelis (volt)
  const pad = 16;
  page.drawRectangle({
    x: pad, y: pad, width: W - 2 * pad, height: H - 2 * pad,
    borderColor: VOLT, borderWidth: 1.4, color: INK, opacity: 0,
  });

  // Logotipas (viršuje, centre)
  const logoW = 150;
  const logoScale = logoW / logoImg.width;
  const logoH = logoImg.height * logoScale;
  page.drawImage(logoImg, { x: (W - logoW) / 2, y: H - 44 - logoH, width: logoW, height: logoH });

  drawCenter("VIRTUALIOS REALYBĖS ERDVĖ · KLAIPĖDA", H - 66, body, 8, SMOKE_2, 1.6);

  // Antraštė
  drawCenter("DOVANŲ KUPONAS", H - 108, display, 30, VOLT, 1);

  // Vertė
  const value = `${formatEur(Number(v.amount_eur))} €`;
  drawCenter(value, H - 190, display, 66, WHITE);

  // Personalizacija (jei yra) — Kam / Nuo / palinkėjimas
  let cursorY = H - 214;
  const personal: string[] = [];
  if (v.recipient_name) personal.push(`Kam: ${v.recipient_name}`);
  if (v.from_name) personal.push(`Nuo: ${v.from_name}`);
  if (personal.length) {
    drawCenter(personal.join("     "), cursorY, body, 11, SMOKE);
    cursorY -= 18;
  }
  if (v.message) {
    const msg = v.message.length > 90 ? v.message.slice(0, 88) + "…" : v.message;
    drawCenter(`„${msg}"`, cursorY, body, 10, SMOKE_2);
    cursorY -= 16;
  }

  // Kodo blokas (volt fonas, tamsus tekstas)
  const code = v.code ?? "—";
  const codeSize = 22;
  const codeW = display.widthOfTextAtSize(code, codeSize);
  const boxW = codeW + 44;
  const boxH = 42;
  const boxX = (W - boxW) / 2;
  const boxY = 96;
  page.drawRectangle({ x: boxX, y: boxY, width: boxW, height: boxH, color: VOLT });
  page.drawText("KODAS", { x: boxX, y: boxY + boxH + 6, size: 8, font: body, color: SMOKE_2 });
  page.drawText(code, {
    x: (W - codeW) / 2,
    y: boxY + (boxH - codeSize) / 2 + 3,
    size: codeSize, font: display, color: VOLT_INK,
  });

  // Galiojimas
  if (v.valid_until) {
    drawCenter(`Galioja iki ${fmtDate(v.valid_until)}`, 74, body, 10, SMOKE);
  }

  // Skirtukas
  page.drawRectangle({ x: pad + 24, y: 58, width: W - 2 * (pad + 24), height: 0.8, color: INK_CARD });

  // Kaip panaudoti + kontaktai
  drawCenter("Kodą nurodykite rezervuodami bala-web-roan.vercel.app arba pateikite atvykę.", 42, body, 8.5, SMOKE_2);
  drawCenter("BALA VR · Pajūrio g. 5B, Klaipėda · +370 684 26686", 28, body, 8.5, SMOKE_2);

  return doc.save();
}
