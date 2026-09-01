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
      <main className="mx-auto max-w-[1100px] px-5 pt-28 md:pt-36 pb-12 md:pb-16">
        <header className="mb-8">
          <h1 className="font-display text-4xl md:text-5xl uppercase">
            Rezervacija
          </h1>
        </header>
        <BookingFlow initialType="room" />
      </main>
      <Footer />
    </>
  );
}
