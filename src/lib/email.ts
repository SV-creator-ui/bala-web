/**
 * El. laiškų siuntimas per Gmail SMTP (nodemailer).
 * Siunčia: (1) patvirtinimą KLIENTUI, (2) pranešimą ADMINISTRATORIUI.
 * TIK serveriui. Jei nesukonfigūruota — tyliai praleidžiama.
 *
 * Aplinkos kintamieji (žr. .env.local.example):
 *   GMAIL_USER          – siuntėjo Gmail (pvz. bala.pramogos@gmail.com)
 *   GMAIL_APP_PASSWORD  – Google „App Password" (16 simbolių; reikia 2FA)
 *   ADMIN_NOTIFY_EMAIL  – kur siųsti pranešimus adminui (numatyta = GMAIL_USER)
 */
import nodemailer from "nodemailer";
import type { BookingRow } from "@/lib/supabase/server";
import { getPartyPackage } from "@/lib/booking/packages";
import { formatEur } from "@/lib/booking/pricing";

function gmailUser(): string {
  return process.env.GMAIL_USER || "";
}
function gmailPass(): string {
  return (process.env.GMAIL_APP_PASSWORD || "").replace(/\s+/g, ""); // App Password dažnai su tarpais
}
function adminEmail(): string {
  return process.env.ADMIN_NOTIFY_EMAIL || gmailUser();
}
function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://bala-web-roan.vercel.app").replace(/\/$/, "");
}

/** Ar el. paštas sukonfigūruotas. */
export function emailConfigured(): boolean {
  return !!(gmailUser() && gmailPass());
}

let cachedTransporter: nodemailer.Transporter | null = null;
function transporter(): nodemailer.Transporter {
  if (!cachedTransporter) {
    cachedTransporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: { user: gmailUser(), pass: gmailPass() },
    });
  }
  return cachedTransporter;
}

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

function serviceName(b: BookingRow): string {
  if (b.type === "party") {
    const pkg = getPartyPackage(b.package_id ?? "");
    return pkg ? `Gimtadienio paketas ${pkg.name}` : "Gimtadienio šventė";
  }
  return "VR pabėgimo kambarys";
}

/* ------------------------- Šablonai ------------------------- */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

function row(k: string, v: string): string {
  return `<tr><td style="padding:6px 0;color:#6b7280;font-size:13px">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${escapeHtml(v)}</td></tr>`;
}

function shell(title: string, inner: string): string {
  return `<!doctype html><html><body style="margin:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:520px;margin:0 auto;padding:24px">
    <div style="background:#111827;color:#fff;border-radius:14px 14px 0 0;padding:18px 22px;font-weight:700;font-size:18px;letter-spacing:.02em">BALA <span style="color:#4db8cc">VR</span></div>
    <div style="background:#fff;border-radius:0 0 14px 14px;padding:22px">
      <h1 style="margin:0 0 8px;font-size:20px">${title}</h1>
      ${inner}
    </div>
    <p style="text-align:center;color:#9ca3af;font-size:12px;margin:16px 0 0">BALA VR · Pajūrio g. 5B, Klaipėda · +370 684 26686</p>
  </div></body></html>`;
}

function customerHtml(b: BookingRow): string {
  const isParty = b.type === "party";
  const total = Number(b.total_eur), dep = Number(b.deposit_eur);
  const inner = `
    <p style="margin:0 0 16px;color:#374151">Ačiū! Jūsų rezervacija patvirtinta. Iki pasimatymo BALA VR${isParty ? " šventėje" : ""}!</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("Paslauga", serviceName(b))}
      ${row("Data", fmtDate(b.date))}
      ${row(isParty ? "Pradžia" : "Laikas", b.time)}
      ${row(isParty ? "Dalyviai" : "Žaidėjai", `${b.players} asm.`)}
      ${row("Sumokėtas avansas", `${formatEur(dep)} €`)}
      ${row("Likutis vietoje", `${formatEur(total - dep)} €`)}
      ${row("Rezervacijos nr.", b.merchant_reference)}
    </table>
    <p style="margin:16px 0 0;color:#374151;font-size:14px">📍 Pajūrio g. 5B, Klaipėda${isParty ? " · atvykite ~15 min. anksčiau" : " · scenarijų pasirinksite atvykę"} · likutį sumokėsite vietoje.</p>
    <p style="margin:12px 0 0;font-size:13px"><a href="${siteUrl()}/taisykles" style="color:#0d9488">BALA VR taisyklės</a></p>`;
  return shell("Rezervacija patvirtinta!", inner);
}

function adminHtml(b: BookingRow): string {
  const isParty = b.type === "party";
  const total = Number(b.total_eur), dep = Number(b.deposit_eur);
  const inner = `
    <p style="margin:0 0 16px;color:#374151">Nauja apmokėta rezervacija.</p>
    <table style="width:100%;border-collapse:collapse">
      ${row("Paslauga", serviceName(b))}
      ${row("Data", fmtDate(b.date))}
      ${row(isParty ? "Pradžia" : "Laikas", b.time)}
      ${b.block_start && b.block_end ? row("Salė užimta", `${b.block_start}–${b.block_end}`) : ""}
      ${row(isParty ? "Dalyviai" : "Žaidėjai", `${b.players} asm.`)}
      ${row("Klientas", b.customer_name)}
      ${row("Telefonas", b.customer_phone)}
      ${row("El. paštas", b.customer_email)}
      ${b.note ? row("Pastaba", b.note) : ""}
      ${row("Suma / avansas", `${formatEur(total)} € / ${formatEur(dep)} €`)}
      ${row("Nr.", b.merchant_reference)}
    </table>`;
  return shell("Nauja rezervacija", inner);
}

/* ------------------------- Siuntimas ------------------------- */

/** Išsiunčia patvirtinimą klientui ir pranešimą adminui. Klaidos — nefatališkos. */
export async function sendBookingEmails(b: BookingRow): Promise<void> {
  if (!emailConfigured()) return;
  const from = `"BALA VR" <${gmailUser()}>`;
  const isParty = b.type === "party";

  const results = await Promise.allSettled([
    transporter().sendMail({
      from,
      to: b.customer_email,
      subject: `Rezervacija patvirtinta — BALA VR (${fmtDate(b.date)} ${b.time})`,
      html: customerHtml(b),
    }),
    transporter().sendMail({
      from,
      to: adminEmail(),
      replyTo: b.customer_email,
      subject: `Nauja rezervacija — ${fmtDate(b.date)} ${b.time} · ${isParty ? "gimtadienis" : "kambarys"}`,
      html: adminHtml(b),
    }),
  ]);

  // Žurnalas (matoma Vercel loguose) — kad būtų aišku, ar laiškai išsiuntė.
  const who = ["klientui " + b.customer_email, "adminui " + adminEmail()];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`[email] OK ${who[i]} messageId=${(r.value as { messageId?: string }).messageId}`);
    } else {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[email] KLAIDA ${who[i]}: ${reason}`);
    }
  });
}
