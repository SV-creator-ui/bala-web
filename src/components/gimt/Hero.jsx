import HeroVideo from "./HeroVideo";

const BOOKING_URL = "https://booking.moizmo.com/lt/booking/";

const stats = [
  { num: "500+", label: "Gimtadienių" },
  { num: "4.9★", label: "Google" },
  { num: "220 m²", label: "Erdvė" },
  { num: "7+", label: "Metų" },
];

export default function Hero() {
  return (
    <section className="hero" id="pradzia">
      <div className="container">
        <div className="hero-inner">
          <div className="hero-visual">
            <div className="hero-video-wrap">
              <HeroVideo
                src="/hero-vr.mp4"
                quote={{
                  text: "„Puiki pramoga tiek suaugusiems, tiek vaikams, tiek šeimai. Nuostabiai praleidom laiką.”",
                  author: "Diana S.",
                }}
              />
            </div>
          </div>
          <div className="hero-text">
            <div className="label hero-eyebrow fade-up">Privati VR šventė</div>
            <h1 className="hero-h1 fade-up fade-up-1">
              Vaikų gimtadienis Klaipėdoje,{" "}
              <em>kur nereikia galvoti, kuo juos užimti</em>
            </h1>
            <p
              className="hero-sub fade-up fade-up-2"
              style={{ marginBottom: "var(--space-4)" }}
            >
              Privati 220 m² BALA VR erdvė tik jūsų šventei: VR misijos,
              interaktyvi siena, nemokami arkadiniai žaidimai, instruktoriaus
              priežiūra ir poilsio zona tėvams.
            </p>
            <p className="hero-sub fade-up fade-up-2">
              Vaikai žaidžia komandomis, laksto tarp veiklų, švenčia su tortu — o
              jūs galite ramiai išgerti kavos ir stebėti viską per ekraną.
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
