import { FAQ_ITEMS } from "@/lib/bala-data";

/**
 * FAQPage struktūrizuoti duomenys. Google gali rodyti FAQ rich result'ą
 * paieškos rezultatuose (išplėstas SERP įrašas su išsiskleidžiančiais
 * klausimais) — vienas efektyviausių CTR boost'erių lokaliam verslui.
 */
export default function FaqJsonLd() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ_ITEMS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
