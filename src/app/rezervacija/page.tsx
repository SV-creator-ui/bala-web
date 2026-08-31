import type { Metadata } from "next";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata: Metadata = {
  title: "Rezervacija — BALA VR pabėgimo kambariai Klaipėdoje",
  description:
    "Rezervuok VR pabėgimo kambario laiką BALA VR Klaipėdoje. Pasirink laiką, žaidėjų skaičių ir sumokėk avansą internetu.",
};

export default async function Page({ searchParams }: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const t = typeof sp.type === "string" ? sp.type : undefined;
  const p = typeof sp.pkg === "string" ? sp.pkg : undefined;
  const initialType = t === "party" || t === "room" ? t : undefined;
  const initialPkgId = initialType === "party" ? p : undefined;

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
        <BookingFlow initialType={initialType} initialPkgId={initialPkgId} />
      </main>
      <Footer />
    </>
  );
}
