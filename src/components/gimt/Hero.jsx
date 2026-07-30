import HeroVideo from "./HeroVideo";

const BOOKING_URL = "https://booking.moizmo.com/lt/booking/";

const stats = [
  { num: "500+", label: "Gimtadienių" },
  { num: "4.9★", label: "Google" },
  { num: "23", label: "Žaidėjų" },
  { num: "7+", label: "Metų" },
];

export default function Hero() {
  return (
    <section className="hero">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-visual">
            <div className="hero-video-wrap">
              <HeroVideo src="/hero-vr.mp4" />
            </div>
          </div>
          <div className="hero-text">
            <div className="label hero-eyebrow fade-up">Gimtadienis Klaipėdoje</div>
            <h1 className="hero-h1 fade-up fade-up-1">
              Gimtadienis,
              <br />
              kurį vaikai
              <br />
              <em>prisimins visada</em>
            </h1>
            <p className="hero-sub fade-up fade-up-2">
              220 m² privati VR erdvė iki 23 žaidėjų. Vaikai žaidžia, tėvai ilsisi
              — kava, TV, ir ramybė jūsų laukia.
            </p>
            <div className="hero-ctas fade-up fade-up-3">
              <a href={BOOKING_URL} className="btn btn-primary">
                PASIRINKTI PAKETĄ
              </a>
              <a href="tel:+37068426686" className="btn btn-ghost">
                SKAMBINTI
              </a>
            </div>
            <div className="hero-stats-row in-hero-text">
              {stats.map((s, i) => (
                <div key={s.label} className={`hero-stat fade-up fade-up-${i + 1}`}>
                  <div className="hero-stat-num">{s.num}</div>
                  <div className="hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-video-wrap">
              <HeroVideo src="/hero-video.mp4" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
