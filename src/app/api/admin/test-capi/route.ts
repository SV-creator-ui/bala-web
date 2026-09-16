/**
 * GET /api/admin/test-capi
 * Vienkartinis Meta CAPI diagnostikos endpoint'as — patikrinam, ar
 * META_CAPI_ACCESS_TOKEN validus ir Meta priima Purchase eventą.
 *
 * Elgesys:
 *  - Reikalauja admin sesijos.
 *  - Jei nustatytas META_CAPI_TEST_EVENT_CODE — eventas eina į „Test Events"
 *    tab'ą Meta Events Manager'yje ir NEĮSKAIČIUOJAMAS į statistiką.
 *  - Grąžina Meta atsakymą pilnai — matomos klaidos ir events_received laukas.
 *
 * Po sėkmingos verifikacijos šis route'as bus pašalintas atskiru commit'u.
 */
import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/admin/auth";
import { META_PIXEL_ID } from "@/lib/analytics";
import { createHash } from "node:crypto";

export const dynamic = "force-dynamic";

const CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN ?? "";
const CAPI_TEST_EVENT_CODE = process.env.META_CAPI_TEST_EVENT_CODE ?? "";
const CAPI_ENDPOINT = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events`;

function sha256(v: string): string {
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: "Neautorizuota" }, { status: 401 });
  }

  const envCheck = {
    META_PIXEL_ID: META_PIXEL_ID || null,
    META_CAPI_ACCESS_TOKEN_present: !!CAPI_ACCESS_TOKEN,
    META_CAPI_ACCESS_TOKEN_length: CAPI_ACCESS_TOKEN.length,
    META_CAPI_TEST_EVENT_CODE_present: !!CAPI_TEST_EVENT_CODE,
    META_CAPI_TEST_EVENT_CODE_value: CAPI_TEST_EVENT_CODE || null,
  };

  if (!CAPI_ACCESS_TOKEN) {
    return NextResponse.json({
      ok: false,
      envCheck,
      hint: "META_CAPI_ACCESS_TOKEN env vars nenustatytas Vercel'yje (arba nesuveikė redeploy). Patikrink Settings → Environment Variables ir Redeploy.",
    });
  }

  const testRef = `TEST-CAPI-${Date.now()}`;
  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        event_id: testRef,
        event_source_url: "https://bala.lt/",
        action_source: "website",
        user_data: {
          em: [sha256("test@bala.lt")],
        },
        custom_data: {
          value: 30,
          currency: "EUR",
          content_name: "capi_diagnostic",
          content_category: "capi_diagnostic",
        },
      },
    ],
    ...(CAPI_TEST_EVENT_CODE ? { test_event_code: CAPI_TEST_EVENT_CODE } : {}),
  };

  try {
    const res = await fetch(`${CAPI_ENDPOINT}?access_token=${encodeURIComponent(CAPI_ACCESS_TOKEN)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const text = await res.text();
    let body: unknown = text;
    try {
      body = JSON.parse(text);
    } catch {}
    return NextResponse.json({
      ok: res.ok,
      httpStatus: res.status,
      httpStatusText: res.statusText,
      envCheck,
      testEventId: testRef,
      metaEndpoint: CAPI_ENDPOINT,
      metaResponse: body,
      hint: res.ok
        ? CAPI_TEST_EVENT_CODE
          ? "Sėkmė. Patikrink Meta Events Manager → Test Events tab per ~30 sek. — matysi eventą su content_name=capi_diagnostic."
          : "Sėkmė. Patikrink Meta Events Manager → Overview per keletą minučių (be TEST kodo eventai eina į produkciją)."
        : "Meta grąžino klaidą. Žr. metaResponse.error.message — dažniausiai netinkamas token'as arba pixel_id neatitinka.",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      envCheck,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
