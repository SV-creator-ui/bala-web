import { WEEKDAY_OFFER } from "@/lib/offers";

const BOOKING_URL = "/gimtadieniai/rezervacija";

export default function ScarcityCta() {
  return (
    <section className="scarcity">
      <div className="container">
        <div className="scarcity-inner">
          <div className="scarcity-accent">
            <span className="scarcity-dot"></span>
            Savaitgaliai pildosi greitai
          </div>
          <h2 className="scarcity-h2">Rezervuokite savo datą dabar</h2>
          <p className="scarcity-sub">
            Savaitgalių laikas užpildomas 2–3 savaitės iš anksto.
          </p>
          <a href={BOOKING_URL} className="scarcity-offer">
            <span className="scarcity-offer-label">{WEEKDAY_OFFER.label}</span>
            <span className="scarcity-offer-note">ir daugiau laisvų laikų</span>
          </a>
          <div className="scarcity-ctas">
            <a href={BOOKING_URL} className="btn btn-primary">
              PATIKRINTI LAISVUS LAIKUS
            </a>
            <a href="tel:+37068426686" className="btn btn-ghost">
              +370 684 26686
            </a>
          </div>
          <p className="scarcity-phone" style={{ marginTop: "16px" }}>
            arba rašykite el. paštu{" "}
            <a href="mailto:bala.pramogos@gmail.com">bala.pramogos@gmail.com</a>
          </p>
        </div>
      </div>
    </section>
  );
}
