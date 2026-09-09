import type { Metadata } from "next";
import Nav from "@/components/bala/Nav";
import Footer from "@/components/bala/Footer";
import VoucherPurchase from "@/components/voucher/VoucherPurchase";
import BreadcrumbJsonLd from "@/components/bala/BreadcrumbJsonLd";

export const metadata: Metadata = {
  title: "Dovanų kuponas — VR pabėgimo kambariai Klaipėdoje",
  description:
    "Padovanokite BALA VR pabėgimo kambario nuotykį Klaipėdoje. 30–100 € arba laisvos vertės dovanų kuponas, galioja 6 mėn. Apmokėjus atsiųsime PDF į el. paštą.",
  alternates: { canonical: "/pabegimo-kambariai/dovanu-kuponas" },
  openGraph: {
    title: "Dovanų kuponas — BALA VR pabėgimo kambariai Klaipėdoje",
    description:
      "Padovanokite VR pabėgimo kambario nuotykį. 30–100 € kuponas arba laisvos vertės. Galioja 6 mėnesius.",
    url: "/pabegimo-kambariai/dovanu-kuponas",
    type: "website",
    images: [
      {
        url: "/assets/logo-bala-vr.png",
        width: 1200,
        height: 630,
        alt: "BALA VR dovanų kuponas",
      },
    ],
  },
};

const voucherProductSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "BALA VR dovanų kuponas",
  description:
    "Dovanų kuponas VR pabėgimo kambariui Klaipėdoje. Galima pasirinkti 30, 50, 75, 100 € vertę arba laisvą sumą. Galioja 6 mėnesius nuo įsigijimo, tinka bet kuriam iš 9 scenarijų.",
  image: "https://bala.lt/assets/logo-bala-vr.png",
  brand: { "@type": "Brand", name: "BALA VR" },
  category: "Dovanų kuponas",
  offers: {
    "@type": "AggregateOffer",
    priceCurrency: "EUR",
    lowPrice: "30",
    highPrice: "300",
    offerCount: "5",
    availability: "https://schema.org/InStock",
    url: "https://bala.lt/pabegimo-kambariai/dovanu-kuponas",
    seller: {
      "@type": "Organization",
      name: "BALA VR",
      url: "https://bala.lt",
    },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(voucherProductSchema) }}
      />
      <BreadcrumbJsonLd
        items={[
          { name: "Pradžia", url: "https://bala.lt" },
          { name: "Pabėgimo kambariai", url: "https://bala.lt/pabegimo-kambariai" },
          { name: "Dovanų kuponas", url: "https://bala.lt/pabegimo-kambariai/dovanu-kuponas" },
        ]}
      />
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
