import { Tick } from "./Icons";

const BOOKING_URL = "https://booking.moizmo.com/lt/booking/";

const packages = [
  {
    name: "MIDI",
    sub: "1.5 val. · iki 10 vaikų",
    tagline: "Trumpai, aktyviai šventei mažesnei grupei.",
    price: "€189",
    features: [
      "VR žaidimų seansas",
      "Arkadiniai žaidimai",
      "Tėvų lounge + kava",
      "Instruktoriaus priežiūra",
    ],
    featured: false,
    cta: "btn-secondary",
  },
  {
    name: "MAKSI",
    sub: "2 val. · iki 12 vaikų",
    tagline: "Populiariausias pasirinkimas 10–12 vaikų gimtadieniui.",
    price: "€239",
    features: [
      "Viskas iš MIDI paketo",
      "Papildoma 30 min.",
      "Iki 12 vaikų",
      "Interaktyvi LED siena",
    ],
    featured: false,
    cta: "btn-secondary",
  },
  {
    name: "VIP",
    sub: "2.5 val. · iki 15 vaikų",
    tagline:
      "Geriausias balansas: daugiau VR, daugiau laiko tortui ir mažiau skubėjimo.",
    price: "€279",
    features: [
      "Viskas iš MAKSI paketo",
      "Iki 15 vaikų",
      "Renginio vedėjas visą laiką",
      "Nemokama darbo dienos nuolaida",
    ],
    featured: true,
    cta: "btn-primary",
  },
  {
    name: "GOLD",
    sub: "3 val. · iki 15 vaikų",
    tagline: "Kai norite šventės be spaudimo ir su daugiau laiko poilsiui.",
    price: "€339",
    features: [
      "Viskas iš VIP paketo",
      "3 valandos visiško malonumo",
      "Prioritetinis laikų pasirinkimas",
      "Maksimalus lankstumas",
    ],
    featured: false,
    cta: "btn-secondary",
  },
];

const HeartIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const PopcornIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8a2 2 0 0 0 0-4 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0-4 0 2 2 0 0 0 0 4" />
    <path d="M10 22 9 8" />
    <path d="m14 22 1-14" />
    <path d="M20 8c.5 0 .9.4.8 1l-2.6 12c-.1.5-.7 1-1.2 1H7c-.6 0-1.1-.5-1.2-1L3.2 9c-.1-.6.3-1 .8-1Z" />
  </svg>
);

const CoffeeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f0a500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

// Skraidančios širdelės VIP kortelės fone (fiksuotos reikšmės — be hydration klaidų).
const VIP_HEARTS = [
  { left: 8, size: 16, dur: 3.2, delay: 0.0, shade: "#ff8fb3", r: -18 },
  { left: 20, size: 22, dur: 3.9, delay: 0.6, shade: "#ff6f9c", r: 14 },
  { left: 33, size: 14, dur: 3.0, delay: 1.1, shade: "#ffa6c4", r: -10 },
  { left: 46, size: 26, dur: 4.3, delay: 0.3, shade: "#ff5c8a", r: 20 },
  { left: 58, size: 18, dur: 3.5, delay: 1.5, shade: "#ff89b0", r: -22 },
  { left: 70, size: 20, dur: 4.0, delay: 0.9, shade: "#ff6f9c", r: 12 },
  { left: 82, size: 15, dur: 3.3, delay: 1.9, shade: "#ffa6c4", r: -14 },
  { left: 90, size: 23, dur: 4.2, delay: 0.5, shade: "#ff5c8a", r: 18 },
];

function VipHearts() {
  return (
    <div className="vip-hearts" aria-hidden="true">
      {VIP_HEARTS.map((h, i) => (
        <span
          key={i}
          className="vip-heart"
          style={{
            "--left": `${h.left}%`,
            "--size": `${h.size}px`,
            "--shade": h.shade,
            "--dur": `${h.dur}s`,
            "--delay": `${h.delay}s`,
            "--r": `${h.r}deg`,
          }}
        >
          ♥
        </span>
      ))}
    </div>
  );
}

export default function Packages() {
  return (
    <section className="packages section" id="packages">
      <div className="container">
        <div className="label">Gimtadienio paketai</div>
        <h2 className="section-heading">Pasirinkite savo šventę</h2>
        <div className="packages-grid">
          {packages.map((pkg) => (
            <div
              className={`price-card${pkg.featured ? " featured" : ""}`}
              key={pkg.name}
            >
              {pkg.featured && <VipHearts />}
              {pkg.featured && (
                <div className="price-badge">
                  <span className="badge badge-amber">POPULIARIAUSIAS</span>
                </div>
              )}
              <div className="price-card-content">
                <div>
                  <div className="price-name">{pkg.name}</div>
                  <div className="price-sub">{pkg.sub}</div>
                  <div className="price-tagline">{pkg.tagline}</div>
                </div>
                <div className="price-amount">
                  <span className="price-num">{pkg.price}</span>
                  <span className="price-period">visas paketas</span>
                </div>
                <div className="price-divider"></div>
                <ul className="price-features">
                  {pkg.features.map((f) => (
                    <li className="price-feature" key={f}>
                      <Tick className="price-check" />
                      {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={BOOKING_URL}
                  className={`btn ${pkg.cta}`}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  REZERVUOTI
                </a>
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            textAlign: "center",
            marginTop: "var(--space-6)",
            fontFamily: "var(--font-body)",
            fontSize: "var(--fs-body)",
            color: "var(--white-45)",
          }}
        >
          Darbo dienomis — papildoma nuolaida. Skambinkite ir susiderinsime.
        </p>

        {/* ── EXTRAS ── */}
        <div style={{ marginTop: "var(--space-12)" }}>
          <div className="label extras-label">Papildymai</div>
          <h3
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 700,
              fontSize: "20px",
              color: "var(--white)",
              textAlign: "center",
              marginBottom: "var(--space-2)",
            }}
          >
            Padarykite šventę dar ypatingesnę
          </h3>
          <p
            style={{
              fontFamily: "var(--font-body)",
              fontSize: "16px",
              color: "var(--white-45)",
              textAlign: "center",
              marginBottom: 0,
            }}
          >
            Pasirinkite vieną ar kelis papildymus — galite pridėti rezervuodami
            arba susisiekę su mumis.
          </p>
          <div className="extras-grid">
            {/* 1. Prisiminimų paketas — FEATURED, span 2 */}
            <div className="extra-card featured-extra">
              <div className="extra-icon">
                <HeartIcon />
              </div>
              <div className="extra-name">Šventės prisiminimų paketas</div>
              <div className="extra-desc">
                Padarykite gimtadienį dar asmeniškesnį — su mažais, bet vaikui
                labai svarbiais šventės akcentais.
              </div>
              <ul className="extra-list">
                <li className="extra-list-item">
                  <Tick className="extra-check" size={14} />
                  Gimtadienio vaiko pasveikinimas didžiajame ekrane
                </li>
                <li className="extra-list-item">
                  <Tick className="extra-check" size={14} />
                  Momentinė nuotrauka prisiminimui
                </li>
                <li className="extra-list-item">
                  <Tick className="extra-check" size={14} />
                  Diplomas gimtadienio vaikui
                </li>
              </ul>
              <p
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: "16px",
                  color: "var(--white-45)",
                  lineHeight: 1.5,
                  marginTop: "var(--space-2)",
                }}
              >
                Mažas papildymas, kuris šventei suteikia daugiau dėmesio, emocijos
                ir gražų prisiminimą.
              </p>
              <div className="extra-price">Paklauskite kainos →</div>
            </div>

            {/* 2. VR MAX */}
            <div className="extra-card">
              <div className="extra-icon">
                <EyeIcon />
              </div>
              <div className="extra-name">VR MAX</div>
              <div className="extra-desc">
                Daugiau VR laiko be skubėjimo. Idealus tiems, kam VR — svarbiausia
                šventės dalis.
              </div>
              <div className="extra-price">+€20</div>
            </div>

            {/* 3. Papildomas laikas */}
            <div className="extra-card">
              <div className="extra-icon">
                <ClockIcon />
              </div>
              <div className="extra-name">Papildomas laikas</div>
              <div className="extra-desc">
                Kai šventė įsisiūbuoja ir nesinori skubėti namo.
              </div>
              <ul className="extra-list" style={{ marginTop: "4px" }}>
                <li className="extra-list-item">
                  <Tick className="extra-check" size={14} />
                  +15 min — €30
                </li>
                <li className="extra-list-item">
                  <Tick className="extra-check" size={14} />
                  +30 min — €50
                </li>
              </ul>
              <div className="extra-price" style={{ fontSize: "16px" }}>
                nuo €30
              </div>
            </div>

            {/* 4. Popkornas */}
            <div className="extra-card">
              <div className="extra-icon">
                <PopcornIcon />
              </div>
              <div className="extra-name">Kino vakaro popkornas</div>
              <div className="extra-desc">
                Saldus ar sūrus — vaikams puiki užkanda žaidimo pertraukėlei.
              </div>
              <div className="extra-price">+€10</div>
            </div>

          </div>

          {/* Kava tėvams — horizontalus blokas po kitais papildymais */}
          <div className="extra-card extra-card-wide">
            <div className="extra-icon">
              <CoffeeIcon />
            </div>
            <div className="extra-wide-body">
              <div className="extra-name">Kava ir arbata tėvams</div>
              <div className="extra-desc">
                Jūsų poilsio valanda — su šiltu gėrimu lounge zonoje.
              </div>
            </div>
            <div className="extra-price-free">
              <span className="extra-free-badge">Įskaičiuota</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
