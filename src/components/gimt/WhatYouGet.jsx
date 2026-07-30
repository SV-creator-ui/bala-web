const features = [
  {
    emoji: "🥽",
    title: "Komandinės VR misijos su naujausiais Pico 4 Ultra akiniais",
    desc: "Ne pavieniai žaidimai, o tikri nuotykiai, kuriuose vaikai bendradarbiauja ir siekia bendro tikslo.",
    wide: true,
  },
  {
    emoji: "🎮",
    title: "Profesionaliai organizuojama renginio programa",
    desc: "Patyręs vedėjas koordinuoja visas veiklas, paaiškina taisykles ir pasirūpina, kad šventė vyktų sklandžiai.",
  },
  {
    emoji: "✨",
    title: "Interaktyvi LED siena",
    desc: "Aktyvūs žaidimai su lietimui ir kamuoliukams jautriais efektais – puiki pramoga tarp VR misijų.",
  },
  {
    emoji: "🕹️",
    title: "Neribotas naudojimasis arkadiniais žaidimais",
    desc: "Stalo futbolas, oro ritulys, vairavimo simuliatorius, Mortal Kombat ir kiti arkadiniai žaidimai.",
  },
  {
    emoji: "🛋️",
    title: "Atskira poilsio zona tėvams",
    desc: "Patogi lounge zona su sofa ir TV ekranu — ramiai ilsitės ir per ekraną stebite, ką vaikai žaidžia.",
  },
  {
    emoji: "🔒",
    title: "Visa erdvė tik jums",
    desc: "Šventės metu privati erdvė skirta tik jūsų svečiams — jokių pašalinių.",
  },
  {
    emoji: "🎂",
    title: "Privati vaišių zona",
    desc: "Jauki erdvė tortui, užkandžiams ir gimtadienio sveikinimams.",
  },
];

// Fone nesustodami plaukiantys spalvoti balionai (fiksuotos reikšmės — be hydration klaidų).
const BALLOONS = [
  { left: 4, size: 56, dur: 15, delay: 0, c: "#f0a500", sway: 26 },
  { left: 14, size: 42, dur: 18, delay: 4, c: "#4db8cc", sway: -20 },
  { left: 24, size: 64, dur: 13, delay: 2, c: "#ff6f9c", sway: 22 },
  { left: 37, size: 46, dur: 17, delay: 6, c: "#8b6cf0", sway: -24 },
  { left: 50, size: 52, dur: 14, delay: 1, c: "#5cd6a0", sway: 20 },
  { left: 62, size: 44, dur: 19, delay: 5, c: "#ffbb33", sway: -18 },
  { left: 74, size: 60, dur: 13, delay: 3, c: "#5b8def", sway: 24 },
  { left: 85, size: 46, dur: 16, delay: 7, c: "#ff8f5c", sway: -22 },
  { left: 93, size: 50, dur: 15, delay: 2, c: "#4db8cc", sway: 18 },
];

export default function WhatYouGet() {
  return (
    <section className="what section" id="what">
      <div className="what-balloons" aria-hidden="true">
        {BALLOONS.map((b, i) => (
          <span
            key={i}
            className="what-balloon"
            style={{
              "--left": `${b.left}%`,
              "--size": `${b.size}px`,
              "--dur": `${b.dur}s`,
              "--delay": `${b.delay}s`,
              "--c": b.c,
              "--sway": `${b.sway}px`,
            }}
          />
        ))}
      </div>
      <div className="container">
        <div className="label">Kas įeina</div>
        <h2 className="section-heading">Kiekvieną gimtadienio programą įskaičiuota</h2>
        <div className="features-grid">
          {features.map((f) => (
            <div
              key={f.title}
              className={`feature-item card${f.wide ? " feature-item-wide" : ""}`}
            >
              <div className="feature-emoji">{f.emoji}</div>
              <div className="feature-body">
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
