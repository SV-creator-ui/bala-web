/**
 * Atsisakymas nuo rinkodaros laiškų.
 *  - POST (forma iš /atsisakyti arba „List-Unsubscribe-Post" iš pašto kliento): pažymi email.
 *  - GET nieko nekeičia (kad laiškų skenavimo botai netyčia neatsisakytų) — nukreipia į patvirtinimo puslapį.
 */
import { NextResponse } from "next/server";
import { markUnsubscribed, normalizeEmail } from "@/lib/promo/storage";
import { verifyUnsubscribeToken } from "@/lib/promo/unsubscribe";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function readParams(req: Request): Promise<{ e: string; t: string }> {
  const url = new URL(req.url);
  let e = url.searchParams.get("e") || "";
  let t = url.searchParams.get("t") || "";
  if (!e || !t) {
    try {
      const ct = req.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const b = await req.json();
        e = e || String(b.e || "");
        t = t || String(b.t || "");
      } else {
        const f = await req.formData();
        e = e || String(f.get("e") || "");
        t = t || String(f.get("t") || "");
      }
    } catch {
      /* tuščias body — naudojam tik query */
    }
  }
  return { e: normalizeEmail(e), t };
}

export async function POST(req: Request) {
  const { e, t } = await readParams(req);
  if (!verifyUnsubscribeToken(e, t)) {
    return NextResponse.json({ ok: false, error: "Netinkama nuoroda" }, { status: 400 });
  }
  try {
    await markUnsubscribed(e);
  } catch (err) {
    console.error("[unsubscribe] klaida:", err instanceof Error ? err.message : err);
    return NextResponse.json({ ok: false, error: "Nepavyko išsaugoti, bandykite vėliau" }, { status: 500 });
  }
  // Forma iš puslapio — grįžtam į puslapį su „done"; pašto klientui pakanka 200.
  const accept = req.headers.get("accept") || "";
  if (accept.includes("text/html")) {
    const url = new URL("/atsisakyti", req.url);
    url.searchParams.set("done", "1");
    return NextResponse.redirect(url, 303);
  }
  return NextResponse.json({ ok: true });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = new URL("/atsisakyti", req.url);
  const e = url.searchParams.get("e");
  const t = url.searchParams.get("t");
  if (e) target.searchParams.set("e", e);
  if (t) target.searchParams.set("t", t);
  return NextResponse.redirect(target, 302);
}
