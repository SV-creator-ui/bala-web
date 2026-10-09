/**
 * Grupių užklausos (įmonės, mokyklos) — POST iš /imonems ir /mokykloms formų.
 * Nieko nesaugo DB: siunčia pranešimą administratoriui el. paštu,
 * su Reply-To = kliento el. paštas, kad būtų galima atsakyti tiesiai iš Gmail.
 */
import { NextResponse } from "next/server";
import { adminNotifyAddress, emailConfigured, getTransporter, senderAddress } from "@/lib/email";
import { inquiryCreateRateLimit, tooManyRequestsResponse } from "@/lib/rate-limit";

export const runtime = "nodejs";

type Kind = "imone" | "mokykla";

const KIND_LABEL: Record<Kind, string> = { imone: "Įmonė / kolektyvas", mokykla: "Mokykla / klasė" };
const FORMAT_LABEL: Record<Kind, Record<string, string>> = {
  imone: { pas_mus: "Kolektyvas atvyksta į BALA VR", pas_jus: "BALA VR atvažiuoja į įmonę" },
  mokykla: { pas_mus: "Klasė atvyksta į BALA VR", pas_jus: "BALA VR atvyksta į mokyklą" },
};

function str(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function esc(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

export async function POST(req: Request) {
  const rl = await inquiryCreateRateLimit(req);
  if (!rl.allowed) return tooManyRequestsResponse(rl.retryAfter);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Neteisinga užklausa." }, { status: 400 });
  }

  // Honeypot — botai užpildo paslėptą lauką; apsimetam, kad viskas gerai.
  if (str(body.website, 200)) return NextResponse.json({ ok: true });

  const kind = body.kind === "mokykla" ? "mokykla" : body.kind === "imone" ? "imone" : null;
  const name = str(body.name, 120);
  const phone = str(body.phone, 40);
  const email = str(body.email, 160);
  const participants = str(body.participants, 20);
  const date = str(body.date, 60);
  const organization = str(body.organization, 160);
  const format = str(body.format, 20);
  const age = str(body.age, 60);
  const invoice = body.invoice === true;
  const comment = str(body.comment, 2000);

  if (!kind) return NextResponse.json({ error: "Neteisinga užklausa." }, { status: 400 });
  if (!name || !phone) {
    return NextResponse.json({ error: "Nurodykite vardą ir telefono numerį." }, { status: 400 });
  }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Patikrinkite el. pašto adresą." }, { status: 400 });
  }

  if (!emailConfigured()) {
    console.error("[inquiries] el. paštas nesukonfigūruotas — užklausa neišsiųsta", { kind, name, phone });
    return NextResponse.json(
      { error: "Nepavyko išsiųsti užklausos. Paskambinkite mums: +370 684 26686." },
      { status: 503 },
    );
  }

  const rows: [string, string][] = [
    ["Tipas", KIND_LABEL[kind]],
    ...(FORMAT_LABEL[kind][format] ? [["Formatas", FORMAT_LABEL[kind][format]] as [string, string]] : []),
    [kind === "mokykla" ? "Mokykla, miestas" : "Įmonė / vieta", organization],
    ["Dalyvių skaičius", participants],
    ...(kind === "mokykla" ? [["Mokinių amžius / klasė", age] as [string, string]] : []),
    ["Pageidaujama data", date],
    ...(kind === "imone" ? [["Reikės sąskaitos faktūros", invoice ? "Taip" : "Ne"] as [string, string]] : []),
    ["Vardas", name],
    ["Telefonas", phone],
    ["El. paštas", email],
    ["Komentaras", comment],
  ];

  const text = rows.map(([k, v]) => `${k}: ${v || "—"}`).join("\n");
  const html = `
    <h2 style="font-family:Arial,sans-serif">Nauja užklausa iš bala.lt</h2>
    <table style="font-family:Arial,sans-serif;font-size:15px;border-collapse:collapse">
      ${rows
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 14px 6px 0;color:#666;vertical-align:top">${esc(k)}</td><td style="padding:6px 0;white-space:pre-wrap">${esc(v || "—")}</td></tr>`,
        )
        .join("")}
    </table>`;

  const subjectBits = [KIND_LABEL[kind], participants && `${participants} dalyv.`, date].filter(Boolean);

  try {
    await getTransporter().sendMail({
      from: senderAddress(),
      to: adminNotifyAddress(),
      replyTo: email || undefined,
      subject: `Nauja užklausa: ${subjectBits.join(" · ")}`,
      text,
      html,
    });
  } catch (e) {
    console.error("[inquiries] siuntimo klaida", e);
    return NextResponse.json(
      { error: "Nepavyko išsiųsti užklausos. Paskambinkite mums: +370 684 26686." },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}
