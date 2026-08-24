import { Tick } from "./Icons";
import ReserveButton from "./ReserveButton";

const BOOKING_URL = "https://booking.moizmo.com/lt/booking/";

const packages = [
  {
    name: "MIDI",
    sub: "1.5 val.",
    tagline: "Trumpai, aktyviai šventei mažesnei grupei.",
    price: "€189",
    features: [
      "1,5 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 10 žaidėjų, 5 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Instruktoriaus priežiūra",
    ],
    featured: false,
    cta: "btn-secondary",
  },
  {
    name: "MAKSI",
    sub: "2 val.",
    tagline: "Populiariausias pasirinkimas 10–12 vaikų gimtadieniui.",
    price: "€239",
    flowId: "8f5a3a15-6817-4dc1-a31f-befd888973b9",
    features: [
      "2 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 12 žaidėjų, 6 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Instruktoriaus priežiūra",
    ],
    featured: false,
    cta: "btn-secondary",
  },
  {
    name: "VIP",
    sub: "2.5 val.",
    tagline:
      "Dar daugiau VR žaidimų, daugiau laiko tortui ir mažiau skubėjimo.",
    price: "€289",
    features: [
      "2,5 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 14 žaidėjų, 7 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Interaktyvi siena",
      "Instruktoriaus priežiūra",
    ],
    featured: true,
    cta: "btn-primary",
  },
  {
    name: "GOLD",
    sub: "3 val.",
    tagline: "Kai norite išskirtinės šventės su daug laiko VR ir poilsiui.",
    price: "€359",
    features: [
      "3 val. apsilankymas",
      "Įtraukta ~ 30 min. vaišėms",
      "Iki 16 žaidėjų, 8 VR akiniai",
      "VR komandiniai žaidimai",
      "Arkadiniai žaidimai",
      "Interaktyvi siena",
      "Instruktoriaus priežiūra",
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
    <section className="packages section" id="paketai">
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
                  <div className="price-head">
                    <div className="price-name">{pkg.name}</div>
                    <div className="price-sub">{pkg.sub}</div>
                  </div>
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
                <ReserveButton
                  href={BOOKING_URL}
                  flowId={pkg.flowId}
                  className={`btn ${pkg.cta}`}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  REZERVUOTI
                </ReserveButton>
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
          20€ NUOLAIDA I–IV dieniais
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
          <div className="extras-grid">
            {/* VR MAX */}
            <div className="extra-card">
              <div className="extra-icon">
                <EyeIcon />
              </div>
              <div className="extra-name">VR MAX</div>
              <div className="extra-desc">
                Trumpiname pertraukas ir skiriame maksimaliai laiką VR žaidimams.
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
              <div className="extra-price">+15 min — €30</div>
            </div>

            {/* 4. Popkornas */}
            <div className="extra-card">
              <div className="extra-icon">
                <PopcornIcon />
              </div>
              <div className="extra-name">Kino vakaro popkornas</div>
              <div className="extra-desc">
                Šviežias, gardžiai kvepiantis popkornas — kvapas, kuris iškart sukuria šventinę nuotaiką.
              </div>
              <div className="extra-price">+€10</div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
