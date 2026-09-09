/**
 * BreadcrumbList struktūrizuoti duomenys.
 * Google paieškos rezultatuose vietoj pilno URL rodo breadcrumb navigaciją
 * („Pradžia › Pabėgimo kambariai › Drakonų bokštas"), tai gerina CTR
 * ir suteikia kontekstą apie puslapio vietą svetainės struktūroje.
 *
 * Naudojimas:
 *   <BreadcrumbJsonLd items={[
 *     { name: "Pabėgimo kambariai", url: "https://bala.lt/pabegimo-kambariai" },
 *     { name: "Visi kambariai", url: "https://bala.lt/pabegimo-kambariai/kambariai" },
 *     { name: "Drakonų bokštas", url: "https://bala.lt/pabegimo-kambariai/kambariai/dragon-tower" },
 *   ]} />
 */
type Crumb = { name: string; url: string };

export default function BreadcrumbJsonLd({ items }: { items: Crumb[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
