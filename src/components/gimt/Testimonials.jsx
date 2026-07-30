"use client";

import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    text: "„Puiki vieta vaikų gimtadieniui. Visi vaikai išėjo puikiomis emocijomis. Didelė rekomendacija!”",
    author: "Dovilė K.",
  },
  {
    text: "„Puiki erdvė – geras laikas garantuotas. Laikas ištirpo. Vaikai pilni gerų emocijų. Malonus bendravimas. Švaru. Jauku. Tikrai rekomenduojame! Ir patys planuosime sugrįžimą. Tinka ir suaugusių pramogai.”",
    author: "Aistė I.",
  },
  {
    text: "„Nusprendėme atšvęsti vaiko gimtadienį BALA VR kambaryje ir tikrai nenusivylėme. Šventė gavosi tobula, vaikai begalo laimingi, nenorėjo išeiti kai pasibaigė laikas.\n   Viskas puikiai apgalvota. Puikus išplanavimas: kol vieni žaidžia įvairius žaidimus su akiniais viename kambaryje, kiti gali smagiai praleisti laiką kitame kambaryje, kur yra pilna veiklos su interaktyvia siena ir stalo žaidimais. Patiko, kad visi vaikai gali rasti veiklos ir nesėdi, laukdami kol kiti pažais su akiniais. Laikas tiesiog pralėkė. Tik geriausi atsiliepimai nuo mūsų ir mūsų svečių!”",
    author: "Irina A.",
  },
  {
    text: "„Labai šauni vieta gimtadienio šventei. Kol vieni žaidžia VR žaidimus, kiti gali mėgautis gausybe kitų stalo bei interaktyvių žaidimų. Svarbiausia užimtumas, visi laimingi. Vieta labai tvarkinga, prižiūrėta, malonus aptarnavimas, didelis stalas, gali sutalpinti visus svečius.\n   Apgalvota iki smulkmenų: žvakučių uždegimui, torto pjaustymui, kavai paskanauti ir panašiai. Tad labai rekomenduoju. Mūsų šventė praėjo puikiai.”",
    author: "Ema",
  },
  {
    text: "„Puiki pramoga tiek suaugusiems, tiek vaikams, tiek šeimai. Nuostabiai praleidom laiką. Puikus aptarnavimas, kokybiška technika, malonūs darbuotojai. Rekomenduoju.”",
    author: "Diana S.",
  },
  {
    text: "„Smagi vieta!!! Gimtadieniams švęsti labai smagu. Daug gerų, stiprių emocijų. Rekomenduoju!!!”",
    author: "Vaida V.",
  },
];

const AUTOPLAY_MS = 6000;
const HOVER_DELAY = 1000; // kiek laukti prieš pasukant, kai pelė ties šonine kortele
const LEN = testimonials.length;

// Kokį vaidmenį atlieka kortelė pagal aktyvų indeksą.
function getRole(i, active) {
  if (i === active) return "center";
  if (i === (active - 1 + LEN) % LEN) return "left";
  if (i === (active + 1) % LEN) return "right";
  return "hidden";
}

// Oficialus spalvotas Google „G" logotipas.
function GoogleG() {
  return (
    <svg className="google-g" viewBox="0 0 48 48" width="16" height="16" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function Testimonials() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const [cfHeight, setCfHeight] = useState(null);
  const revealRef = useRef(null);
  const coverflowRef = useRef(null);
  const reducedRef = useRef(false);
  const hoverTimer = useRef(null);
  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const next = () => setActive((a) => (a + 1) % LEN);
  const prev = () => setActive((a) => (a - 1 + LEN) % LEN);

  // Viso bloko pasirodymas slenkant
  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const el = revealRef.current;
    if (!el) return;
    if (reducedRef.current) {
      el.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Konteinerio aukštį pritaikome prie aktyvios kortelės, kad ji išsiplėstų
  // pagal visą tekstą (be vidinio slinkimo). Telefone paliekame CSS auto aukštį.
  useEffect(() => {
    const measure = () => {
      if (typeof window === "undefined") return;
      if (window.innerWidth <= 768) {
        setCfHeight(null);
        return;
      }
      const inner = coverflowRef.current?.querySelector(".cf-center .cf-inner");
      if (!inner) return;
      // +48px atsargos „plaukiojimo" animacijai ir šešėliui
      setCfHeight(inner.scrollHeight + 48);
    };
    // Matuojame po atvaizdavimo (kad tekstas jau būtų išdėstytas)
    const raf = requestAnimationFrame(measure);
    const t = setTimeout(measure, 120); // po šriftų pakrovimo
    window.addEventListener("resize", measure);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
      window.removeEventListener("resize", measure);
    };
  }, [active]);

  // Automatinis sukimasis (sustoja užvedus pelę arba esant reduced-motion)
  useEffect(() => {
    if (paused || reducedRef.current) return;
    const id = setTimeout(next, AUTOPLAY_MS);
    return () => clearTimeout(id);
  }, [active, paused]);

  // Išvalyti uždelsimo laikmatį išeinant
  useEffect(() => () => clearTimeout(hoverTimer.current), []);

  // Užvedus pelę ant šoninės kortelės — po trumpos pauzės pasukama į tą atsiliepimą.
  const handleSideEnter = (role) => {
    clearTimeout(hoverTimer.current);
    hoverTimer.current = setTimeout(() => {
      if (role === "left") prev();
      else if (role === "right") next();
    }, HOVER_DELAY);
  };
  const handleSideLeave = () => {
    clearTimeout(hoverTimer.current);
  };
  const handleSideClick = (role) => {
    clearTimeout(hoverTimer.current);
    if (role === "left") prev();
    else if (role === "right") next();
  };

  // Perbraukimas (swipe) — pagrindinis navigacijos būdas telefone, kur šoninės
  // kortelės nerodomos.
  const handleTouchStart = (e) => {
    const t = e.touches[0];
    touchStartX.current = t.clientX;
    touchStartY.current = t.clientY;
    setPaused(true);
  };
  const handleTouchEnd = (e) => {
    if (touchStartX.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX.current;
    const dy = t.clientY - touchStartY.current;
    const SWIPE_MIN = 40;
    // Reaguojame tik į aiškų horizontalų mostą (kad neblokuotume vertikalaus slinkimo).
    if (Math.abs(dx) > SWIPE_MIN && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setPaused(false);
  };

  return (
    <section className="testimonials section" id="atsiliepimai">
      <div className="container">
        <div className="label">Tėvų atsiliepimai</div>
        <h2 className="section-heading">Ką sako šeimos</h2>

        <div className="cf-reveal" ref={revealRef}>
          <div
            className="coverflow"
            ref={coverflowRef}
            style={cfHeight ? { height: `${cfHeight}px` } : undefined}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {testimonials.map((t, i) => {
              const role = getRole(i, active);
              const isSide = role === "left" || role === "right";
              return (
                <div
                  key={t.author}
                  className={`cf-card cf-${role}`}
                  onMouseEnter={() => isSide && handleSideEnter(role)}
                  onMouseLeave={() => isSide && handleSideLeave()}
                  onClick={() => isSide && handleSideClick(role)}
                  aria-hidden={role !== "center"}
                >
                  <div className="card testimonial cf-inner">
                    <div className="testimonial-google">
                      <GoogleG />
                      Google atsiliepimas
                    </div>
                    <div className="testimonial-stars">★★★★★</div>
                    <p className="testimonial-text" style={{ whiteSpace: "pre-line" }}>{t.text}</p>
                    <div className="testimonial-author">{t.author}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cf-swipe-hint" aria-hidden="true">
            ← Braukite norėdami peržiūrėti →
          </div>

          <div className="tcar-dots" role="tablist" aria-label="Atsiliepimai">
            {testimonials.map((t, i) => (
              <button
                key={t.author}
                type="button"
                className={`tcar-dot${i === active ? " active" : ""}`}
                onClick={() => setActive(i)}
                aria-label={`Rodyti atsiliepimą ${i + 1}`}
                aria-selected={i === active}
                role="tab"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
