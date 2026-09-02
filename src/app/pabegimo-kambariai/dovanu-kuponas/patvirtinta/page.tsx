/**
 * Grįžimo iš Montonio puslapis (dovanų kuponas). Patikrina order-token,
 * aktyvuoja kuponą (jei webhook dar nespėjo), išsiunčia PDF ir parodo rezultatą.
 */
import Link from "next/link";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import { formatEur } from "@/lib/booking/pricing";
import { readConfirmParams } from "@/lib/booking/confirm";
import { resolveVoucher, resolveVoucherByRef } from "@/lib/voucher/fulfill";

export const dynamic = "force-dynamic";

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { token, ref } = readConfirmParams(sp);
  const { status, voucher } = token ? await resolveVoucher(token) : await resolveVoucherByRef(ref);

  return (
    <>
      <Nav />
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-[520px]">
          {status === "active" && voucher && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-volt text-volt-ink text-4xl">🎁</div>
              <h1 className="font-display text-4xl uppercase mb-2">Kuponas paruoštas!</h1>
              <p className="text-smoke mb-8">
                PDF kuponą išsiuntėme el. paštu <b className="text-white">{voucher.buyer_email}</b>. Galite jį atspausdinti arba persiųsti dovanų gavėjui.
              </p>

              <div className="rounded-2xl border border-line bg-ink-card text-left overflow-hidden">
                <div className="flex items-center justify-between bg-volt text-volt-ink px-6 py-4">
                  <span className="font-bold tracking-wide">BALA · DOVANŲ KUPONAS</span>
                  <span className="font-mono text-sm">{formatEur(Number(voucher.amount_eur))} €</span>
                </div>
                <div className="px-6 py-6 text-center">
                  <div className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">Kupono kodas</div>
                  <div className="mt-1 font-display text-3xl tracking-[0.08em] text-white">{voucher.code}</div>
                  {voucher.valid_until && (
                    <div className="mt-3 text-sm text-smoke">Galioja iki {fmtDate(voucher.valid_until)}</div>
                  )}
                </div>
                <div className="border-t border-dashed border-line px-6 py-4 text-sm text-smoke">
                  Kodą nurodykite rezervuodami internetu arba pateikite atvykę. Kuponas vienkartinis.
                </div>
              </div>

              <Link href="/pabegimo-kambariai" className="mt-6 inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">
                Grįžti į pradžią
              </Link>
            </div>
          )}

          {status === "pending" && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-volt text-volt text-3xl">⏳</div>
              <h1 className="font-display text-3xl uppercase mb-2">Laukiama apmokėjimo</h1>
              <p className="text-smoke mb-8">Jūsų mokėjimas dar apdorojamas. Kai tik jis patvirtinamas, kuponą gausite el. paštu. Jei apmokėjote — palaukite kelias minutes.</p>
              <Link href="/pabegimo-kambariai" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Grįžti į pradžią</Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-genre-pink text-genre-pink text-3xl">!</div>
              <h1 className="font-display text-3xl uppercase mb-2">Nepavyko rasti kupono</h1>
              <p className="text-smoke mb-8">Jei apmokėjote, bet matote šį pranešimą — susisiekite su mumis, ir viską sutvarkysime.</p>
              <Link href="/pabegimo-kambariai/dovanu-kuponas" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Bandyti dar kartą</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
