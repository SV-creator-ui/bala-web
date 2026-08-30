/**
 * Montonio Stargate API integracija (mokėjimo inicijavimas + webhook tikrinimas).
 * Dokumentacija: https://docs.montonio.com
 *
 * Autentifikacija: užsakymo objektas paverčiamas JWT (HS256), pasirašomas
 * jūsų Secret Key ir siunčiamas kaip { data: <jwt> } į POST /api/orders.
 * Webhook'e Montonio atsiunčia { orderToken: <jwt> }, kurį patikriname tuo
 * pačiu Secret Key.
 *
 * TIK serveriui — čia naudojami slapti raktai iš aplinkos kintamųjų.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

function accessKey(): string {
  const k = process.env.MONTONIO_ACCESS_KEY;
  if (!k) throw new Error("Trūksta MONTONIO_ACCESS_KEY. Žr. REZERVACIJA_SETUP.md");
  return k;
}

function secretKey(): Uint8Array {
  const k = process.env.MONTONIO_SECRET_KEY;
  if (!k) throw new Error("Trūksta MONTONIO_SECRET_KEY. Žr. REZERVACIJA_SETUP.md");
  return new TextEncoder().encode(k);
}

function baseUrl(): string {
  return process.env.MONTONIO_ENV === "production"
    ? "https://stargate.montonio.com"
    : "https://sandbox-stargate.montonio.com";
}

export type CreateOrderParams = {
  merchantReference: string;
  amount: number; // suma, kurią klientas moka dabar (avansas), EUR
  returnUrl: string;
  notificationUrl: string;
  description?: string;
};

export type CreateOrderResult = {
  uuid: string;
  paymentUrl: string;
};

/** Sukuria Montonio užsakymą ir grąžina apmokėjimo nuorodą */
export async function createMontonioOrder(p: CreateOrderParams): Promise<CreateOrderResult> {
  const payload = {
    accessKey: accessKey(),
    merchantReference: p.merchantReference,
    returnUrl: p.returnUrl,
    notificationUrl: p.notificationUrl,
    grandTotal: p.amount,
    currency: "EUR",
    locale: "lt",
    payment: {
      method: "paymentInitiation", // bankinė nuoroda (Swedbank, SEB, Luminor...)
      amount: p.amount,
      currency: "EUR",
      methodDisplay: "Bankinė nuoroda",
      methodOptions: {
        preferredCountry: "LT",
      },
    },
  };

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setExpirationTime("10m")
    .sign(secretKey());

  const res = await fetch(`${baseUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ data: token }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Montonio klaida (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { uuid: string; paymentUrl: string };
  return { uuid: data.uuid, paymentUrl: data.paymentUrl };
}

export type MontonioOrderToken = JWTPayload & {
  uuid?: string;
  merchantReference?: string;
  paymentStatus?: string; // "PAID" | "PENDING" | ...
  accessKey?: string;
};

/**
 * Patikrina Montonio atsiųstą order-token (webhook'e arba return URL'e).
 * Meta klaidą, jei parašas neteisingas.
 */
export async function verifyMontonioToken(token: string): Promise<MontonioOrderToken> {
  const { payload } = await jwtVerify(token, secretKey(), { algorithms: ["HS256"] });
  return payload as MontonioOrderToken;
}
