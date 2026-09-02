import type { Metadata } from "next";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import VoucherPurchase from "@/components/voucher/VoucherPurchase";

export const metadata: Metadata = {
  title: "Dovanų kuponas — BALA VR pabėgimo kambariai Klaipėdoje",
  description:
    "Padovanokite BALA VR pabėgimo kambario nuotykį. Pasirinkite dovanų kupono vertę, apmokėkite internetu ir gaukite gražų PDF kuponą į el. paštą.",
};

export default function Page() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1100px] px-5 pt-28 md:pt-36 pb-12 md:pb-16">
        <header className="mb-4">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-volt mb-2">🎁 Dovanų kuponas</p>
          <h1 className="font-display text-4xl md:text-5xl uppercase">Padovanokite nuotykį</h1>
          <p className="mt-3 max-w-[64ch] text-smoke">
            BALA VR dovanų kuponas — puiki dovana gimtadienio, švenčių ar tiesiog geros nuotaikos proga.
            Apmokėjus atsiųsime gražų PDF kuponą į Jūsų el. paštą — atspausdinkite arba persiųskite dovanų gavėjui.
            Kuponas galioja <b className="text-white">6 mėnesius</b> ir tinka bet kuriam pabėgimo kambariui.
          </p>
        </header>
        <VoucherPurchase />
      </main>
      <Footer />
    </>
  );
}
