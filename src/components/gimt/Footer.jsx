export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="footer-brand-name">
              BALA<span>VR</span>
            </div>
            <div className="footer-tagline">Virtualios realybės erdvė</div>
            <p className="footer-desc">
              220 m² VR žaidimų salė Klaipėdoje. Gimtadieniai, grupiniai žaidimai,
              ir nepamirštamos patirtys nuo 2021 m.
            </p>
          </div>
          <div>
            <div className="footer-col-title">Kontaktai</div>
            <div className="footer-col-links">
              <a href="tel:+37068426686">+370 684 26686</a>
              <a href="mailto:bala.pramogos@gmail.com">bala.pramogos@gmail.com</a>
              <a href="https://m.me/balavr">Facebook Messenger</a>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Adresas</div>
            <div className="footer-col-links">
              <a
                href="https://maps.google.com/?q=Pajūrio+g.+5B,+Klaipėda"
                target="_blank"
                rel="noreferrer"
              >
                Pajūrio g. 5B
                <br />
                Klaipėda
              </a>
              <span style={{ color: "var(--white-45)", fontSize: "16px" }}>
                IŠANKSTINĖ REGISTRACIJA
              </span>
            </div>
          </div>
          <div>
            <div className="footer-col-title">Sekite mus</div>
            <div className="footer-col-links">
              <a href="https://facebook.com/balavr" target="_blank" rel="noreferrer">
                Facebook
              </a>
              <a href="https://instagram.com/bala.vr" target="_blank" rel="noreferrer">
                Instagram
              </a>
              <a href="https://bala.lt" target="_blank" rel="noreferrer">
                bala.lt
              </a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copy">© 2025 BALA VR. Visos teisės saugomos.</p>
          <div className="footer-accent-line"></div>
          <p className="footer-copy">
            <a href="/taisykles" style={{ color: "inherit", textDecoration: "underline" }}>
              Taisyklės
            </a>{" "}
            · Klaipėda · Lietuva
          </p>
        </div>
      </div>
    </footer>
  );
}
