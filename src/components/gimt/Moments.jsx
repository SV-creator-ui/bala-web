// Tikros akimirkos iš gimtadienių BALA VR arenoje — nesustodama plaukianti foto juosta.
const moments = [
  { img: "/moments/m-1.webp", caption: "Komandinis VR nuotykis", w: 1010, h: 720 },
  { img: "/moments/m-2.webp", caption: "Gimtadienio komanda", w: 960, h: 720 },
  { img: "/moments/m-3.webp", caption: "VR misija įsibėgėja", w: 479, h: 720 },
  { img: "/moments/m-4.webp", caption: "Taiklus šūvis VR", w: 540, h: 720 },
  { img: "/moments/m-5.webp", caption: "Arkadinės pramogos", w: 507, h: 720 },
  { img: "/moments/m-6.webp", caption: "Lenktynių simuliatorius", w: 540, h: 720 },
  { img: "/moments/m-7.webp", caption: "Oro ritulio dvikova", w: 479, h: 720 },
  { img: "/moments/m-8.webp", caption: "Pirmoji VR patirtis", w: 540, h: 720 },
  { img: "/moments/m-9.webp", caption: "Poilsio zona tėvams", w: 540, h: 720 },
];

export default function Moments() {
  // Juostą dubliuojame, kad animacija suktųsi be pertrūkio (loop per -50%).
  const loop = [...moments, ...moments];

  return (
    <section className="moments section" id="akimirkos">
      <div className="container">
        <div className="label">Tikros akimirkos</div>
        <h2 className="section-heading">Gimtadieniai BALA VR arenoje</h2>
        <p className="moments-lead">
          Ne inscenizuotos nuotraukos — tikros emocijos ir svečiai mūsų žaidimų
          erdvėje Klaipėdoje.
        </p>
      </div>

      <div className="moments-marquee" aria-label="Akimirkos iš gimtadienių">
        <div className="moments-track">
          {loop.map((m, i) => (
            <figure
              className="moment-card"
              key={i}
              aria-hidden={i >= moments.length ? "true" : undefined}
            >
              <img
                src={m.img}
                alt={`BALA VR gimtadienis – ${m.caption}`}
                width={m.w}
                height={m.h}
                draggable="false"
              />
              <figcaption className="moment-caption">{m.caption}</figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
