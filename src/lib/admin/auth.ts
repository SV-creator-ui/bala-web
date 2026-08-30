/**
 * Admin skydelio autentifikacija.
 * - Slaptažodis iš aplinkos: ADMIN_PASSWORD.
 * - Jei DB nesukonfigūruota (nėra Supabase) — DEMO režimas, slaptažodis "demo".
 * - Jei DB yra, bet ADMIN_PASSWORD nenustatytas — prieiga UŽRAKINTA
 *   (kad realūs duomenys neliktų prieinami su numatytu slaptažodžiu).
 *
 * Sesija — pasirašytas JWT httpOnly slapuke.
 */
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "bala_admin";

export function dbConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** DEMO režimas duomenims — kai nėra DB, naudojami pavyzdiniai duomenys */
export function demoMode(): boolean {
  return !dbConfigured();
}

/** Laukiamas slaptažodis, arba null jei prieiga užrakinta */
function expectedPassword(): string | null {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  if (demoMode()) return "demo";
  return null; // DB yra, bet slaptažodžio nėra -> užrakinta
}

export function adminLocked(): boolean {
  return expectedPassword() === null;
}

export function checkPassword(input: string): boolean {
  const pw = expectedPassword();
  return pw !== null && input === pw;
}

function secret(): Uint8Array {
  return new TextEncoder().encode(process.env.ADMIN_PASSWORD || "bala-demo-admin-secret-v1");
}

export async function createSessionToken(): Promise<string> {
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
}

/** Ar dabartinis vartotojas prisijungęs (tikrina slapuką) */
export async function isAuthed(): Promise<boolean> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
