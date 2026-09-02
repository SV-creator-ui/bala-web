/**
 * Dovanų kupono el. laiškai. Laiškas su prisegtu PDF keliauja PIRKĖJUI
 * (jis pats padovanoja). Adminui — trumpas pranešimas apie pardavimą.
 * Jei el. paštas nesukonfigūruotas — tyliai praleidžiama.
 */
import type { VoucherRow } from "@/lib/supabase/server";
import { emailConfigured, getTransporter, senderAddress, adminNotifyAddress } from "@/lib/email";
import { formatEur } from "@/lib/booking/pricing";

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
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

function buyerHtml(v: VoucherRow): string {
  const code = v.code ?? "—";
  const inner = `
    <p style="margin:0 0 16px;color:#374151">Ačiū! Jūsų dovanų kuponas paruoštas. Jį rasite prisegtą PDF formatu — galite atspausdinti arba persiųsti dovanų gavėjui.</p>
    <div style="border:2px dashed #d1d5db;border-radius:12px;padding:16px;text-align:center;margin:0 0 16px">
      <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:.1em">Kupono kodas</div>
      <div style="font-size:26px;font-weight:800;letter-spacing:.06em;color:#111827;margin-top:4px">${escapeHtml(code)}</div>
      <div style="font-size:22px;font-weight:700;color:#0d9488;margin-top:8px">${formatEur(Number(v.amount_eur))} €</div>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Galioja iki</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${v.valid_until ? fmtDate(v.valid_until) : "—"}</td></tr>
    </table>
    <p style="margin:16px 0 0;color:#374151;font-size:14px">Kaip panaudoti: kodą įveskite rezervuodami internetu arba pateikite atvykę į BALA VR. Kuponas vienkartinis.</p>`;
  return shell("Jūsų dovanų kuponas 🎁", inner);
}

function adminHtml(v: VoucherRow): string {
  const inner = `
    <p style="margin:0 0 16px;color:#374151">Parduotas naujas dovanų kuponas.</p>
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Kodas</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${escapeHtml(v.code ?? "—")}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Vertė</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${formatEur(Number(v.amount_eur))} €</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Galioja iki</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${v.valid_until ? fmtDate(v.valid_until) : "—"}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Pirkėjas</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${escapeHtml(v.buyer_name)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">El. paštas</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${escapeHtml(v.buyer_email)}</td></tr>
      <tr><td style="padding:6px 0;color:#6b7280;font-size:13px">Nr.</td><td style="padding:6px 0;text-align:right;font-weight:600;color:#111827">${escapeHtml(v.merchant_reference)}</td></tr>
    </table>`;
  return shell("Naujas dovanų kuponas", inner);
}

/** Išsiunčia kupono PDF pirkėjui + pranešimą adminui. Klaidos — nefatališkos. */
export async function sendVoucherEmails(v: VoucherRow, pdf: Uint8Array): Promise<void> {
  if (!emailConfigured()) return;
  const from = senderAddress();
  const attachments = [{
    filename: `BALA-VR-dovanu-kuponas-${v.code ?? "kuponas"}.pdf`,
    content: Buffer.from(pdf),
    contentType: "application/pdf",
  }];

  const results = await Promise.allSettled([
    getTransporter().sendMail({
      from,
      to: v.buyer_email,
      subject: `Jūsų dovanų kuponas — BALA VR (${formatEur(Number(v.amount_eur))} €)`,
      html: buyerHtml(v),
      attachments,
    }),
    getTransporter().sendMail({
      from,
      to: adminNotifyAddress(),
      replyTo: v.buyer_email,
      subject: `Parduotas dovanų kuponas — ${formatEur(Number(v.amount_eur))} € (${v.code ?? v.merchant_reference})`,
      html: adminHtml(v),
    }),
  ]);

  const who = ["pirkėjui " + v.buyer_email, "adminui " + adminNotifyAddress()];
  results.forEach((r, i) => {
    if (r.status === "fulfilled") {
      console.log(`[voucher-email] OK ${who[i]} messageId=${(r.value as { messageId?: string }).messageId}`);
    } else {
      const reason = r.reason instanceof Error ? r.reason.message : String(r.reason);
      console.error(`[voucher-email] KLAIDA ${who[i]}: ${reason}`);
    }
  });
}
