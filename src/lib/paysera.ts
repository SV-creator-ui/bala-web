/**
 * Paysera „Mokėjimų surinkimas" (klasikinis WebToPay) integracija.
 * Dokumentacija: https://developers.paysera.com/en/checkout/
 *
 * Srautas:
 *  1. Sukuriame užsakymą -> nukreipiame klientą į Paysera su `data` + `sign`.
 *     `data` = url-safe base64(query), `sign` = md5(data + projekto slaptažodis).
 *  2. Paysera serveris kviečia mūsų `callbackurl` su `data` + `ss1` (+ `ss2`).
 *     Patikriname `ss1 == md5(data + slaptažodis)`, iššifruojame, `status==1` = apmokėta.
 *
 * TIK serveriui — naudoja slaptą projekto slaptažodį iš aplinkos.
 */
import { createHash } from "node:crypto";

const PAY_URL = "https://bank.paysera.com/pay/";

function projectId(): string {
  const id = process.env.PAYSERA_PROJECT_ID;
  if (!id) throw new Error("Trūksta PAYSERA_PROJECT_ID");
  return id;
}
function signPassword(): string {
  const p = process.env.PAYSERA_SIGN_PASSWORD;
  if (!p) throw new Error("Trūksta PAYSERA_SIGN_PASSWORD");
  return p;
}

/** Ar Paysera sukonfigūruota (galima priimti mokėjimus). */
export function payseraConfigured(): boolean {
  return !!(process.env.PAYSERA_PROJECT_ID && process.env.PAYSERA_SIGN_PASSWORD);
}

/** Paysera testinis režimas (imituojami mokėjimai, be realių pinigų). */
export function payseraTestFlag(): "1" | "0" {
  return process.env.PAYSERA_TEST === "1" ? "1" : "0";
}

/** Vietinis testavimas — mokėjimas praleidžiamas visiškai (be Paysera). */
export function bookingTestMode(): boolean {
  return process.env.BOOKING_TEST_MODE === "1";
}

/* --- url-safe base64 (kaip WebToPay bibliotekoje) --- */
function safeBase64Encode(input: string): string {
  return Buffer.from(input, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
}
function safeBase64Decode(input: string): string {
  return Buffer.from(input.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}
function md5(s: string): string {
  return createHash("md5").update(s, "utf8").digest("hex");
}

export type CreateOrderParams = {
  merchantReference: string; // orderid
  amount: number; // EUR (pvz. 30 arba 12.50)
  acceptUrl: string; // kur grąžinamas klientas apmokėjus
  cancelUrl: string; // kur grąžinamas atšaukus
  callbackUrl: string; // serverio-serveriui pranešimas
  description?: string;
  email?: string;
};

/** Sukuria Paysera apmokėjimo nuorodą (redirect URL). */
export function createPayseraPaymentUrl(p: CreateOrderParams): string {
  const params = new URLSearchParams();
  params.set("projectid", projectId());
  params.set("orderid", p.merchantReference);
  params.set("version", "1.6");
  params.set("accepturl", p.acceptUrl);
  params.set("cancelurl", p.cancelUrl);
  params.set("callbackurl", p.callbackUrl);
  params.set("amount", String(Math.round(p.amount * 100))); // centais
  params.set("currency", "EUR");
  params.set("country", "LT");
  params.set("lang", "LIT");
  params.set("test", payseraTestFlag());
  if (p.email) params.set("p_email", p.email);
  if (p.description) params.set("paytext", p.description);

  const data = safeBase64Encode(params.toString());
  const sign = md5(data + signPassword());
  return `${PAY_URL}?data=${data}&sign=${sign}`;
}

export type PayseraResult = {
  merchantReference: string;
  paid: boolean; // status == 1
  amountCents: number;
  raw: Record<string, string>;
};

/**
 * Patikrina ir iššifruoja Paysera `data`/`ss1`. Grąžina null, jei parašas
 * neteisingas arba projektas nesutampa (apsauga nuo klastočių).
 */
export function parsePayseraResult(data: string, ss1: string): PayseraResult | null {
  if (!data || !ss1) return null;
  try {
    if (md5(data + signPassword()) !== ss1) return null; // parašas neteisingas
    const parsed = Object.fromEntries(new URLSearchParams(safeBase64Decode(data))) as Record<string, string>;
    if (parsed.projectid !== projectId()) return null;
    return {
      merchantReference: parsed.orderid || "",
      paid: parsed.status === "1",
      amountCents: Number(parsed.amount || 0),
      raw: parsed,
    };
  } catch {
    return null;
  }
}
