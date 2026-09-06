/**
 * Paysera „Checkout Modern" integracija (OAuth2 + REST).
 * Dokumentacija: https://developers.paysera.com/guides/checkout-modern/
 *
 * Srautas:
 *  1. OAuth token (client_credentials) iš PAYSERA_CLIENT_ID + PAYSERA_CLIENT_SECRET.
 *  2. Sukuriamas užsakymas  POST /merchant-order/integration/v1/orders  -> order.id
 *  3. Sukuriama mokėjimo nuoroda  POST /checkout-payment-link/.../payment-links
 *     -> payment_URL (į jį nukreipiamas klientas).
 *  4. Paysera webhook (POST JSON) į callback_url; parašas — HMAC-SHA256(body, client_secret),
 *     antraštėje `X-Paysera-Signature`. Būsena `order.status === "paid"`.
 *
 * TIK serveriui — naudoja slaptą client_secret iš aplinkos.
 */
import { createHmac, timingSafeEqual } from "node:crypto";

const AUTH_URL = "https://api.paysera.com/auth/realms/Paysera/protocol/openid-connect/token";
const ORDERS_URL = "https://api.paysera.com/merchant-order/integration/v1/orders";
const LINKS_URL = "https://api.paysera.com/checkout-payment-link/integration/v1/payment-links";

function clientId(): string {
  const v = process.env.PAYSERA_CLIENT_ID;
  if (!v) throw new Error("Trūksta PAYSERA_CLIENT_ID");
  return v;
}
function clientSecret(): string {
  const v = process.env.PAYSERA_CLIENT_SECRET;
  if (!v) throw new Error("Trūksta PAYSERA_CLIENT_SECRET");
  return v;
}

/** Ar Paysera sukonfigūruota (galima priimti mokėjimus). */
export function payseraConfigured(): boolean {
  return !!(process.env.PAYSERA_CLIENT_ID && process.env.PAYSERA_CLIENT_SECRET);
}

/** Vietinis testavimas — mokėjimas praleidžiamas visiškai (be Paysera). */
export function bookingTestMode(): boolean {
  return process.env.BOOKING_TEST_MODE === "1";
}

/* ---------------- OAuth token (su cache) ---------------- */
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) return tokenCache.token;
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId(),
    client_secret: clientSecret(),
  });
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Paysera OAuth klaida (${res.status}): ${t}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 300) * 1000,
  };
  return data.access_token;
}

async function authedFetch(url: string, init: RequestInit): Promise<Response> {
  const token = await getAccessToken();
  return fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
}

/* ---------------- Mokėjimo sukūrimas ---------------- */
export type CreateOrderParams = {
  merchantReference: string;
  amount: number; // EUR (pvz. 30 arba 12.50)
  acceptUrl: string;
  cancelUrl: string;
  callbackUrl: string;
  description?: string;
  email?: string;
};

export type CreatePaymentResult = { paymentUrl: string; orderId: string };

/** Sukuria Paysera užsakymą + mokėjimo nuorodą. Grąžina apmokėjimo URL ir order id. */
export async function createPayseraPayment(p: CreateOrderParams): Promise<CreatePaymentResult> {
  const cents = Math.round(p.amount * 100);

  // 1) Užsakymas
  const orderRes = await authedFetch(ORDERS_URL, {
    method: "POST",
    body: JSON.stringify({
      redirect_urls: {
        success_url: p.acceptUrl,
        failure_url: p.cancelUrl,
        callback_url: p.callbackUrl,
      },
      purchase: {
        reference: p.merchantReference,
        amount: cents,
        currency: "EUR",
      },
    }),
  });
  if (!orderRes.ok) {
    const t = await orderRes.text().catch(() => "");
    throw new Error(`Paysera order klaida (${orderRes.status}): ${t}`);
  }
  // DĖMESIO: order CREATE atsakymas grąžina `order_id` (ne `id`).
  const order = (await orderRes.json()) as { order_id?: string; id?: string };
  const orderId = order.order_id || order.id;
  if (!orderId) throw new Error("Paysera order be id");

  // 2) Mokėjimo nuoroda
  const linkRes = await authedFetch(LINKS_URL, {
    method: "POST",
    body: JSON.stringify({
      order_id: orderId,
      name: p.description || `BALA VR ${p.merchantReference}`,
      lifetime: 3600,
      experience: { language: "lt", payment_flow: "paysera_checkout" },
      purchase: { amount: cents },
      ...(p.email ? { payer_information: { email: p.email } } : {}),
    }),
  });
  if (!linkRes.ok) {
    const t = await linkRes.text().catch(() => "");
    throw new Error(`Paysera payment-link klaida (${linkRes.status}): ${t}`);
  }
  const link = (await linkRes.json()) as Record<string, string>;
  const paymentUrl = link.payment_URL || link.payment_url || link.url || link.link;
  if (!paymentUrl) throw new Error("Paysera payment-link be URL");

  return { paymentUrl, orderId };
}

/**
 * Užklausia užsakymo būsenos (atsarginis patvirtinimo kelias be webhook'o).
 * GET /orders/{id} grąžina `status` ("pending_payment" | "paid" | ...) bei
 * `amount`/`amount_paid`/`balance_due`. Kad būtų atsparu tiksliai „paid"
 * reikšmei, pilnai apmokėtą (balance_due === 0) normalizuojame į "paid".
 */
export async function getPayseraOrderStatus(orderId: string): Promise<string | null> {
  try {
    const res = await authedFetch(`${ORDERS_URL}/${encodeURIComponent(orderId)}`, { method: "GET" });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      status?: string;
      amount?: number;
      amount_paid?: number;
      balance_due?: number;
    };
    const fullyPaid =
      (typeof data.balance_due === "number" && data.balance_due <= 0 && (data.amount_paid ?? 0) > 0) ||
      (typeof data.amount_paid === "number" && typeof data.amount === "number" && data.amount > 0 && data.amount_paid >= data.amount);
    if (fullyPaid) return "paid";
    return data.status ?? null;
  } catch {
    return null;
  }
}

/** „paid" (arba visiškai apmokėta) laikoma sėkme. */
export function isPaidStatus(status: string | null | undefined): boolean {
  return status === "paid";
}

/* ---------------- Webhook parašo tikrinimas ---------------- */
/** Patikrina X-Paysera-Signature = HMAC-SHA256(raw body, client_secret) (hex). */
export function verifyPayseraSignature(rawBody: string, signatureHex: string): boolean {
  if (!signatureHex) return false;
  try {
    const expected = createHmac("sha256", clientSecret()).update(rawBody, "utf8").digest("hex");
    const a = Buffer.from(expected, "hex");
    const b = Buffer.from(signatureHex.trim(), "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export type PayseraWebhook = { merchantReference: string; paid: boolean; orderId: string | null };

/** Ištraukia iš webhook JSON: mūsų merchantReference, ar apmokėta, order id. */
export function parsePayseraWebhook(rawBody: string): PayseraWebhook | null {
  try {
    const body = JSON.parse(rawBody) as Record<string, unknown>;
    // Įvykio duomenys gali būti body.order arba body.data (gynybinis skaitymas).
    const order = (body.order ?? body.data ?? body) as Record<string, unknown>;
    const purchase = (order.purchase ?? {}) as Record<string, unknown>;
    // reference gali būti top-level (GET formatas) arba purchase.reference (CREATE formatas).
    const reference = String(order.reference ?? purchase.reference ?? "");
    const status = String(order.status ?? "");
    // id gali būti `id` (GET) arba `order_id` (CREATE/link).
    const orderId = order.id ? String(order.id) : order.order_id ? String(order.order_id) : null;
    const balanceDue = typeof order.balance_due === "number" ? (order.balance_due as number) : null;
    const amountPaid = typeof order.amount_paid === "number" ? (order.amount_paid as number) : null;
    const paid =
      status === "paid" ||
      (balanceDue !== null && balanceDue <= 0 && (amountPaid ?? 0) > 0);
    if (!reference) return null;
    return { merchantReference: reference, paid, orderId };
  } catch {
    return null;
  }
}
