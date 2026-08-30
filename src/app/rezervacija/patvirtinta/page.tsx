/**
 * Grįžimo iš Montonio puslapis. Patikrina order-token, atnaujina rezervacijos
 * būseną (jei webhook dar nespėjo) ir parodo rezultatą.
 */
import Link from "next/link";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import { getSupabaseAdmin, type BookingRow } from "@/lib/supabase/server";
import { verifyMontonioToken } from "@/lib/montonio";
import { formatEur } from "@/lib/booking/pricing";

export const dynamic = "force-dynamic";

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

async function resolveBooking(token: string | undefined): Promise<{ status: "paid" | "pending" | "error"; booking?: BookingRow }> {
  if (!token) return { status: "error" };
  try {
    const payload = await verifyMontonioToken(token);
    const ref = payload.merchantReference;
    if (!ref) return { status: "error" };

    const supabase = getSupabaseAdmin();

    // Jei apmokėta — pažymime paid (idempotentiškai; webhook gali dar nespėti)
    if (payload.paymentStatus === "PAID") {
      await supabase.from("bookings").update({ status: "paid" }).eq("merchant_reference", ref).eq("status", "pending");
    }

    const { data } = await supabase.from("bookings").select("*").eq("merchant_reference", ref).single();
    const booking = data as BookingRow | null;
    if (!booking) return { status: "error" };
    return { status: booking.status === "paid" ? "paid" : "pending", booking };
  } catch {
    return { status: "error" };
  }
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const tokenRaw = sp["order-token"] ?? sp["order_token"];
  const token = Array.isArray(tokenRaw) ? tokenRaw[0] : tokenRaw;
  const { status, booking } = await resolveBooking(token);

  return (
    <>
      <Nav />
      <main className="min-h-[70vh] flex items-center justify-center px-5 py-20">
        <div className="w-full max-w-[520px]">
          {status === "paid" && booking && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full bg-volt text-volt-ink text-4xl font-extrabold">✓</div>
              <h1 className="font-display text-4xl uppercase mb-2">Rezervacija patvirtinta!</h1>
              <p className="text-smoke mb-8">Patvirtinimą išsiuntėme el. paštu <b className="text-white">{booking.customer_email}</b>. Iki pasimatymo BALA VR!</p>

              <div className="rounded-2xl border border-line bg-ink-card text-left overflow-hidden">
                <div className="flex items-center justify-between bg-volt text-volt-ink px-6 py-4">
                  <span className="font-bold tracking-wide">BALA · BILIETAS</span>
                  <span className="font-mono text-sm">{booking.merchant_reference}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 px-6 py-5">
                  <Item k="Paslauga" v="VR pabėgimo kambarys" full />
                  <Item k="Data" v={fmtDate(booking.date)} />
                  <Item k="Laikas" v={booking.time} />
                  <Item k="Žaidėjai" v={`${booking.players} asm.`} />
                  <Item k="Sumokėtas avansas" v={`${formatEur(Number(booking.deposit_eur))} € (iš ${formatEur(Number(booking.total_eur))} €)`} full />
                </div>
                <div className="border-t border-dashed border-line px-6 py-4 text-sm text-smoke">
                  📍 BALA VR, Klaipėda · scenarijų pasirinksi atvykęs · likutį sumokėsi vietoje
                </div>
              </div>
            </div>
          )}

          {status === "pending" && booking && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-volt text-volt text-3xl">⏳</div>
              <h1 className="font-display text-3xl uppercase mb-2">Laukiama apmokėjimo</h1>
              <p className="text-smoke mb-8">Jūsų mokėjimas dar apdorojamas. Kai tik jis patvirtinamas, gausite el. laišką. Jei apmokėjote — palaukite kelias minutes.</p>
              <Link href="/pabegimo-kambariai" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Grįžti į pradžią</Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-genre-pink text-genre-pink text-3xl">!</div>
              <h1 className="font-display text-3xl uppercase mb-2">Nepavyko rasti rezervacijos</h1>
              <p className="text-smoke mb-8">Jei apmokėjote, bet matote šį pranešimą — susisiekite su mumis, ir viską sutvarkysime.</p>
              <Link href="/rezervacija" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Bandyti dar kartą</Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Item({ k, v, full = false }: { k: string; v: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">{k}</div>
      <div className="text-base font-semibold mt-0.5">{v}</div>
    </div>
  );
}
