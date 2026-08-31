import Footer from "@/components/gimt/Footer";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata = {
  title: "Gimtadienio rezervacija | BALA VR Klaipėda",
  description:
    "Rezervuokite vaiko gimtadienio šventę BALA VR Klaipėdoje: pasirinkite paketą, laiką ir sumokėkite avansą internetu.",
};

export default async function Page({ searchParams }) {
  const sp = await searchParams;
  const pkg = typeof sp.pkg === "string" ? sp.pkg : undefined;

  return (
    <>
      <header className="gimt-res-header">
        <div className="container gimt-res-bar">
          <a href="/gimtadieniai" className="nav-brand" aria-label="BALA VR — atgal į gimtadienius">
            <span className="nav-brand-text">
              <span className="brand-bala">BALA</span>
              <span className="brand-vr">VR</span>
            </span>
          </a>
          <a href="tel:+37068426686" className="nav-phone">
            +370 684 26686
          </a>
        </div>
      </header>

      <main className="gimt-res-main">
        <div className="container">
          <div className="gimt-res-eyebrow">Gimtadienio rezervacija · Klaipėda</div>
          <h1 className="gimt-res-title">
            Rezervuokite <em>šventę</em>
          </h1>
          <p className="gimt-res-lead">
            Pasirinkite paketą, dieną ir laiką. Vietai patvirtinti sumokamas avansas
            internetu — likutį sumokėsite vietoje.
          </p>

          <div className="gimt-booking">
            <BookingFlow initialType="party" initialPkgId={pkg} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
