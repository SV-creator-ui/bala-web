import type { Metadata } from "next";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Rezervacija — BALA VR pabėgimo kambariai Klaipėdoje",
  description:
    "Rezervuok VR pabėgimo kambario laiką BALA VR Klaipėdoje. Pasirink laiką, žaidėjų skaičių ir sumokėk avansą internetu.",
};

export default async function Page() {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-[1100px] px-5 py-12 md:py-16">
        <header className="mb-8">
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-volt">
            Rezervacija · Klaipėda
          </span>
          <h1 className="font-display text-4xl md:text-5xl uppercase mt-2">
            Rezervuok VR pabėgimo kambarį
          </h1>
        </header>
        <BookingFlow initialType="room" />
      </main>
      <Footer />
    </>
  );
}
