// Google atsiliepimų marquee — nenutrūkstamai plaukianti juosta pasirinkimo puslapyje.
// Stilius kaip gimtadienių „Tikros akimirkos" galerija: turinys dubliuojamas, kad
// -50% loop būtų nematomas; pelės užvedimas pauzuoja, prefers-reduced-motion sustabdo.
const REVIEWS = [
  {
    text: `„Puiki vieta vaikų gimtadieniui. Visi vaikai išėjo puikiomis emocijomis. Didelė rekomendacija!"`,
    author: "Dovilė K.",
    context: "Gimtadienis",
  },
  {
    text: `„Labai patiko! Žaidėme „Bepročio grafo dvarą" — kai puola, slepiesi po stalu, labai daug juoko."`,
    author: "Indrė V.",
    context: "Pabėgimo kambarys",
  },
  {
    text: `„Belekoks prikolas — komandiškai nusikelti į kitą pasaulį, spręsti iššūkius kartu. Labai geras dalykas teambuildingui."`,
    author: "Lukas Č.",
    context: "Kolektyvo šventė",
  },
  {
    text: `„Šventė gavosi tobula, vaikai begalo laimingi, nenorėjo išeiti kai pasibaigė laikas."`,
    author: "Irina A.",
    context: "Gimtadienis",
  },
  {
    text: `„Labai patiko, išgelbėjom kačiuką! Tikrai sugrįšim dar kartą."`,
    author: "Deimantas R.",
    context: "Pabėgimo kambarys",
  },
  {
    text: `„Pirmas kartas! Ir toks geras įspūdis. Laikas ištirpo, o geros emocijos liko. Personalas pasitinka su šypsena."`,
    author: "Ilona S.",
    context: "Pirmas kartas VR",
  },
  {
    text: `„Praėjome pabėgimo kambarį — buvo ir apie ką pagalvoti, ir iš ko pasijuokti. Vedėjas išsamiai paaiškino taisykles. Būtinai grįšime."`,
    author: "Maryna K.",
    context: "Grupė 35+ metų",
  },
  {
    text: `„Esu sužavėta virtualios realybės grafika. Tiek daug emocijų! Puiki galimybė pasitikrinti komandinio darbo stiprybes."`,
    author: "Dovilė S.",
    context: "Komandinis nuotykis",
  },
];

function GoogleG({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden className="flex-none">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export default function ChooserReviewsSlider() {
  const loop = [...REVIEWS, ...REVIEWS];

  return (
    <div
      className="group relative w-full -mx-6 md:mx-0 md:w-full mt-7 md:mt-9 overflow-hidden animate-hero-in [animation-delay:320ms] [mask-image:linear-gradient(90deg,transparent_0,black_8%,black_92%,transparent_100%)] [-webkit-mask-image:linear-gradient(90deg,transparent_0,black_8%,black_92%,transparent_100%)]"
      aria-label="Google 5 žvaigždučių atsiliepimai"
      aria-roledescription="marquee"
    >
      {/* Hover scale — tik desktop pointer'iui; touch device'ai neturi lipnaus hover state. */}
      <style>{`
        @media not all and (hover: hover), not all and (pointer: fine) {
          [data-review-card]:hover {
            scale: 1 !important;
            z-index: auto !important;
            box-shadow: none !important;
            border-color: rgb(255 255 255 / 0.1) !important;
          }
        }
      `}</style>
      <ul className="flex gap-4 w-max py-3 animate-review-marquee group-hover:[animation-play-state:paused] motion-reduce:animate-none">
        {loop.map((r, i) => (
          <li
            key={i}
            data-review-card
            aria-hidden={i >= REVIEWS.length ? true : undefined}
            className="relative flex-none w-[300px] sm:w-[340px] rounded-2xl border border-white/10 bg-white/[0.035] backdrop-blur-sm px-4 py-3.5 text-left flex flex-col transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none hover:scale-[1.05] hover:z-10 hover:border-white/25 hover:shadow-[0_16px_36px_-14px_rgba(255,213,74,0.22)] motion-reduce:hover:transform-none"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 min-w-0">
                <GoogleG size={16} />
                <span className="text-[14px] font-semibold text-white/80 truncate">
                  {r.author}
                  <span className="text-white/45"> · {r.context}</span>
                </span>
              </div>
              <span className="text-[15px] tracking-[0.02em] text-[#ffd54a] leading-none flex-none" aria-hidden>
                ★★★★★
              </span>
            </div>
            <p className="mt-2.5 text-[16.5px] leading-[1.45] text-white/90 flex-1 flex items-center">
              {r.text}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
