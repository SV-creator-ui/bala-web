/**
 * Admin skydelio autentifikacija.
 * - Slaptažodis iš aplinkos: ADMIN_PASSWORD.
 * - ADMIN_PASSWORD ir ADMIN_SESSION_SECRET būtini visuose režimuose.
 * - JWT raktas: atskiras kriptografiškai atsitiktinis ADMIN_SESSION_SECRET
 *   (bent 32 UTF-8 baitai; atsitiktinumą užtikrina rakto generavimas).
 * - Jei autentifikacijos konfigūracijos nėra — prieiga UŽRAKINTA.
 * - Numatytojo slaptažodžio ar atsarginio JWT rakto nėra.
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

/** Vienintelė admin autentifikacijos konfigūracijos patikros vieta. */
function authConfig(): { password: string; secret: Uint8Array } | null {
  const password = process.env.ADMIN_PASSWORD;
  const sessionSecret = process.env.ADMIN_SESSION_SECRET;
  if (!password?.trim() || !sessionSecret?.trim()) return null;
  if (sessionSecret !== sessionSecret.trim() || sessionSecret === password) return null;
  const secret = new TextEncoder().encode(sessionSecret);
  if (secret.byteLength < 32) return null;
  return { password, secret };
}

export function adminLocked(): boolean {
  return authConfig() === null;
}

export function checkPassword(input: string): boolean {
  const config = authConfig();
  return config !== null && input === config.password;
}

export async function createSessionToken(): Promise<string> {
  const config = authConfig();
  if (!config) throw new Error("Admin autentifikacija nesukonfigūruota");
  return await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(config.secret);
}

/** Ar dabartinis vartotojas prisijungęs (tikrina slapuką) */
export async function isAuthed(): Promise<boolean> {
  const config = authConfig();
  if (!config) return false;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, config.secret, { algorithms: ["HS256"] });
    return true;
  } catch {
    return false;
  }
}
