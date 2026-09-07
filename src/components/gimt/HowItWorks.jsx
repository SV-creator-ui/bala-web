const steps = [
  {
    title: "Pasirenkate paketą",
    desc: "Išsirinkite paketą pagal vaikų skaičių ir šventės trukmę, patogiai rezervuokite internetu ir patvirtinkite vietą sumokėję avansą.",
  },
  {
    title: "Atvykimas",
    desc: "Atvykite ne anksčiau nei 15 min. iki šventės pradžios. Galite atsivežti savo užkandžių bei gėrimų, o šventiškesnei nuotaikai — užsisakyti stalo papuošimo paslaugą.",
  },
  {
    title: "Žaidimas",
    desc: "Vaikus suskirstome į komandas ir parenkame jų amžiui tinkamus VR žaidimus. Kol viena komanda žaidžia VR, kiti renkasi interaktyvią sieną, arkadines pramogas arba vaišinasi.",
  },
];

export default function HowItWorks() {
  return (
    <section className="how section" id="kaip-vyksta">
      <div className="container">
        <div className="label">Trys paprasti žingsniai</div>
        <h2 className="section-heading">Kaip vyksta šventė</h2>
        <div className="how-grid">
          {steps.map((step) => (
            <div className="how-step card" key={step.title}>
              <div className="how-step-title">{step.title}</div>
              <p className="how-step-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
