import Nav from "@/components/bala/Nav";
import Hero from "@/components/bala/Hero";
import Footer from "@/components/bala/Footer";
import LocalBusinessJsonLd from "@/components/bala/LocalBusinessJsonLd";
import {
  AtsiliepimaiSection,
  ComparisonSection,
  CtaBandSection,
  DukSection,
  FirstTimeSection,
  KainosSection,
  KaipVykstaSection,
  KamTinkaSection,
  KontaktaiSection,
  ScenarijaiSection,
} from "@/components/bala/Sections";

export default function Home() {
  return (
    <>
      <LocalBusinessJsonLd />
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
        <DukSection />
        <CtaBandSection />
        <KontaktaiSection />
      </main>
      <Footer />
    </>
  );
}
