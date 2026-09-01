/**
 * Grįžimo iš Montonio puslapis (komandiniai VR žaidimai). Patikrina order-token,
 * atnaujina rezervacijos būseną (jei webhook dar nespėjo) ir parodo rezultatą.
 */
import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { BUSINESS } from "@/lib/bala-data";
import { formatEur } from "@/lib/booking/pricing";
import { resolveBooking, resolveByRef, readConfirmParams } from "@/lib/booking/confirm";
import { googleCalendarRenderUrl } from "@/lib/booking/calendar-link";

export const dynamic = "force-dynamic";

const CYAN_THEME = {
  "--color-volt": "#34d1e0",
  "--color-volt-deep": "#26c0d0",
  "--color-volt-ink": "#04252b",
} as CSSProperties;

const MONTHS = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const { token, ref } = readConfirmParams(sp);
  const { status, booking } = token ? await resolveBooking(token) : await resolveByRef(ref);

  return (
    <div className="min-h-[100svh] flex flex-col bg-ink text-white" style={CYAN_THEME}>
      <header className="mx-auto w-full max-w-[1100px] px-6 md:px-10 pt-7 pb-2 flex items-center justify-between gap-4">
        <Link href="/" aria-label="BALA VR — pasirinkti pramogą" className="flex flex-col items-start justify-center">
          <Image src="/assets/logo-bala-vr-wordmark.png" alt="BALA VR" width={220} height={40} className="h-[24px] w-auto" priority />
          <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.18em] leading-none text-white">
            Virtualios realybės erdvė
          </span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-5 py-16">
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
                  <Item k="Paslauga" v="Komandiniai VR žaidimai" full />
                  <Item k="Data" v={fmtDate(booking.date)} />
                  <Item k="Laikas" v={booking.time} />
                  <Item k="Žaidėjai" v={`${booking.players} asm.`} />
                  <Item k="Sumokėtas avansas" v={`${formatEur(Number(booking.deposit_eur))} € (iš ${formatEur(Number(booking.total_eur))} €)`} full />
                </div>
                <div className="border-t border-dashed border-line px-6 py-4 text-sm text-smoke">
                  📍 BALA VR, Klaipėda · atvykite ~10 min. anksčiau · likutį sumokėsi vietoje
                </div>
              </div>

              <a
                href={googleCalendarRenderUrl(booking)}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold hover:border-volt hover:text-volt"
              >
                📅 Pridėti į Google kalendorių
              </a>
            </div>
          )}

          {status === "pending" && booking && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-volt text-volt text-3xl">⏳</div>
              <h1 className="font-display text-3xl uppercase mb-2">Laukiama apmokėjimo</h1>
              <p className="text-smoke mb-8">Jūsų mokėjimas dar apdorojamas. Kai tik jis patvirtinamas, gausite el. laišką. Jei apmokėjote — palaukite kelias minutes.</p>
              <Link href="/komandiniai-vr-zaidimai" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Grįžti</Link>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="mx-auto mb-6 grid h-20 w-20 place-items-center rounded-full border-2 border-genre-pink text-genre-pink text-3xl">!</div>
              <h1 className="font-display text-3xl uppercase mb-2">Nepavyko rasti rezervacijos</h1>
              <p className="text-smoke mb-8">Jei apmokėjote, bet matote šį pranešimą — susisiekite su mumis, ir viską sutvarkysime.</p>
              <Link href="/komandiniai-vr-zaidimai/rezervacija" className="inline-flex rounded-full bg-volt text-volt-ink font-bold px-6 py-3">Bandyti dar kartą</Link>
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-line">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-smoke-2">
          <span>© {new Date().getFullYear()} BALA VR · Pajūrio g. 5B, Klaipėda</span>
          <a href={BUSINESS.phoneHref} className="font-semibold text-smoke hover:text-white transition-colors">
            {BUSINESS.phoneDisplay}
          </a>
        </div>
      </footer>
    </div>
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
