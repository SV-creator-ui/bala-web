import type { Metadata } from "next";
import Nav from "@/components/bala/Nav";
import Hero from "@/components/bala/Hero";
import Footer from "@/components/bala/Footer";
import HashScroll from "@/components/bala/HashScroll";
import FaqJsonLd from "@/components/bala/FaqJsonLd";
import {
  AtsiliepimaiSection,
  ComparisonSection,
  CtaBandSection,
  DovanuKuponasSection,
  DukSection,
  FirstTimeSection,
  KainosSection,
  KaipVykstaSection,
  KamTinkaSection,
  KontaktaiSection,
  ScenarijaiSection,
} from "@/components/bala/Sections";

export const metadata: Metadata = {
  title: "VR pabėgimo kambariai Klaipėdoje — 9 scenarijai",
  description:
    "9 VR pabėgimo kambariai Klaipėdoje: nuo drakonų pilies iki nevaldomo traukinio. 2–6 žaidėjai, iki 50 min. nuotykis. Nuo €20/asm. Pajūrio g. 5B.",
  alternates: { canonical: "/pabegimo-kambariai" },
  openGraph: {
    title: "VR pabėgimo kambariai Klaipėdoje — 9 scenarijai",
    description:
      "9 skirtingi VR pabėgimo scenarijai. 2–6 žaidėjai, iki 50 min. Klaipėdoje, Pajūrio g. 5B.",
    url: "/pabegimo-kambariai",
    type: "website",
    images: [
      {
        url: "/assets/drakonu-bokstas-vr-pabegimo-kambarys-klaipedoje.webp",
        width: 1200,
        height: 630,
        alt: "VR pabėgimo kambariai Klaipėdoje — BALA VR",
      },
    ],
  },
};

export default function Home() {
  return (
    <>
      <FaqJsonLd />
      <HashScroll />
      <Nav />
      <main>
        <Hero />
        <ScenarijaiSection />
        <KaipVykstaSection />
        <FirstTimeSection />
        <ComparisonSection />
        <AtsiliepimaiSection />
        <KamTinkaSection />
        <KainosSection />
        <DovanuKuponasSection />
        <DukSection />
        <CtaBandSection />
        <KontaktaiSection />
      </main>
      <Footer />
    </>
  );
}
