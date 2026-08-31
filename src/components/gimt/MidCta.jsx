const BOOKING_URL = "/rezervacija?type=party";

// Vidurinė CTA juostelė — greitas kelias į rezervaciją nelaukiant paketų sekcijos.
export default function MidCta() {
  return (
    <section className="midcta" aria-label="Rezervacija">
      <div className="container">
        <div className="midcta-inner">
          <div className="midcta-text">
            <h2 className="midcta-title">Jau įsivaizduojate savo šventę?</h2>
            <p className="midcta-sub">
              Pasirinkite datą, kol laikai laisvi — savaitgaliai pildosi greitai.
            </p>
          </div>
          <div className="midcta-actions">
            <a href={BOOKING_URL} className="btn btn-primary">
              PASIRINKTI PAKETĄ
            </a>
            <a href="tel:+37068426686" className="btn btn-ghost">
              SKAMBINTI
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
