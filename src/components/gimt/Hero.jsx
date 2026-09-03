import HeroVideo from "./HeroVideo";

const BOOKING_URL = "/gimtadieniai/rezervacija";

const stats = [
  { num: "500+", label: "Gimtadienių" },
  { num: "4.9★", label: "Google" },
  { num: "220 m²", label: "Erdvė" },
  { num: "7+ m.", label: "Amžius" },
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
            <h1 className="hero-h1 fade-up fade-up-1">
              Nepamirštamas vaikų gimtadienis Klaipėdoje{" "}
              <em>— BALA VR erdvėje</em>
            </h1>
            <p className="hero-sub fade-up fade-up-2">
              Privati 220 m² BALA VR erdvė tik jūsų šventei: VR veiksmo
              žaidimai, interaktyvi siena, arkadiniai žaidimai, instruktoriaus
              priežiūra ir poilsio zona tėvams.
            </p>
            <div className="hero-ctas fade-up fade-up-3">
              <a href={BOOKING_URL} className="btn btn-primary">
                TIKRINTI LAISVUS LAIKUS
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
