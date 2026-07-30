import { BUSINESS } from "@/lib/bala-data";

/**
 * LocalBusiness (EntertainmentBusiness) struktūrizuoti duomenys.
 * Padeda Google susieti telefoną, adresą ir darbo laiką su verslu
 * (rich results, „knowledge panel“, „click-to-call“ paieškoje).
 */
export default function LocalBusinessJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "EntertainmentBusiness",
    "@id": `${BUSINESS.url}/#business`,
    name: BUSINESS.name,
    description:
      "VR pabėgimo kambariai Klaipėdoje – 9 virtualios realybės scenarijai komandai nuo 2 iki 6 žaidėjų.",
    url: BUSINESS.url,
    telephone: BUSINESS.phoneE164,
    image: `${BUSINESS.url}/assets/logo-bala-vr.png`,
    logo: `${BUSINESS.url}/assets/logo-bala-vr.png`,
    priceRange: "€€",
    currenciesAccepted: "EUR",
    address: {
      "@type": "PostalAddress",
      streetAddress: BUSINESS.streetAddress,
      addressLocality: BUSINESS.addressLocality,
      addressRegion: BUSINESS.addressRegion,
      addressCountry: BUSINESS.addressCountry,
    },
    hasMap: BUSINESS.mapsUrl,
    areaServed: {
      "@type": "City",
      name: "Klaipėda",
    },
    openingHoursSpecification: BUSINESS.openingHours.map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: h.days,
      opens: h.opens,
      closes: h.closes,
    })),
    sameAs: [BUSINESS.facebookUrl, BUSINESS.bookingUrl],
  };

  return (
    <script
      type="application/ld+json"
      // JSON.stringify saugiai išvalo turinį; naudojama JSON-LD injekcijai.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
