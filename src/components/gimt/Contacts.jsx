const BOOKING_URL = "/gimtadieniai/rezervacija";
const MAPS_LINK = "https://maps.google.com/?q=Pajūrio+g.+5B,+Klaipėda";
const MAPS_EMBED =
  "https://www.google.com/maps?q=Paj%C5%ABrio%20g.%205B,%20Klaip%C4%97da&z=15&output=embed";

const PinIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);
const PhoneIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);
const MailIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-10 6L2 7" />
  </svg>
);
const ClockIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default function Contacts() {
  return (
    <section className="contacts section" id="kontaktai">
      <div className="container">
        <div className="label">Susisiekite</div>
        <h2 className="section-heading">Kontaktai ir vieta</h2>
        <div className="contacts-grid">
          <div className="contacts-info">
            <div className="contact-item">
              <div className="contact-item-icon">
                <PinIcon />
              </div>
              <div>
                <div className="contact-item-title">Adresas</div>
                <div className="contact-item-value">
                  <a href={MAPS_LINK} target="_blank" rel="noreferrer">
                    Pajūrio g. 5B, Klaipėda
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon">
                <PhoneIcon />
              </div>
              <div>
                <div className="contact-item-title">Telefonas</div>
                <div className="contact-item-value">
                  <a href="tel:+37068426686">+370 684 26686</a>
                </div>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon">
                <MailIcon />
              </div>
              <div>
                <div className="contact-item-title">El. paštas</div>
                <div className="contact-item-value">
                  <a href="mailto:bala.pramogos@gmail.com">
                    bala.pramogos@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="contact-item">
              <div className="contact-item-icon">
                <ClockIcon />
              </div>
              <div>
                <div className="contact-item-title">Darbo laikas</div>
                <div className="contact-item-value">
                  IŠANKSTINĖ REGISTRACIJA
                </div>
              </div>
            </div>

            <div className="contacts-ctas">
              <a href={BOOKING_URL} className="btn btn-primary">
                REZERVUOTI
              </a>
              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noreferrer"
                className="btn btn-ghost"
              >
                Kaip mus rasti →
              </a>
            </div>
          </div>

          <div className="contacts-map">
            <iframe
              src={MAPS_EMBED}
              title="BALA VR žemėlapis — Pajūrio g. 5B, Klaipėda"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
