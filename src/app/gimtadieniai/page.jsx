import Nav from "@/components/gimt/Nav";
import Hero from "@/components/gimt/Hero";
import HowItWorks from "@/components/gimt/HowItWorks";
import WhatYouGet from "@/components/gimt/WhatYouGet";
import Games from "@/components/gimt/Games";
import Packages from "@/components/gimt/Packages";
import Testimonials from "@/components/gimt/Testimonials";
import Faq from "@/components/gimt/Faq";
import Contacts from "@/components/gimt/Contacts";
import ScarcityCta from "@/components/gimt/ScarcityCta";
import Footer from "@/components/gimt/Footer";
import ScrollReveal from "@/components/gimt/ScrollReveal";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <HowItWorks />
        <WhatYouGet />
        <Games />
        <Packages />
        <Testimonials />
        <Faq />
        <Contacts />
        <ScarcityCta />
      </main>
      <Footer />
      <ScrollReveal />
    </>
  );
}
