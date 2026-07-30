const steps = [
  {
    title: "Pasirenkate paketą",
    desc: "Išsirinkite paketą pagal vaikų skaičių ir trukmę. Rezervuokite internetu arba paskambinkite — atsakome greitai.",
  },
  {
    title: "Atvykstate pasiruošę",
    desc: "Rekomenduojame atvykti 10–15 min. anksčiau. Mes pasirūpiname viskuo — jokio papildomo ruošimosi nereikia.",
  },
  {
    title: "Vaikai žaidžia, tėvai ilsisi",
    desc: "Mūsų instruktorius prižiūri vaikus. Jūs patogiai sėdite lounge zonoje su kava ir stebite smagumą per ekraną.",
  },
  {
    title: "Tortas ir prisiminimai",
    desc: "Galite atsivežti savo tortą ir dekoracijas. Pjauname kartu, dainuojame, fotografuojamės — ir išvykstate laimingi.",
  },
];

export default function HowItWorks() {
  return (
    <section className="how section" id="how">
      <div className="container">
        <div className="label">Viskas paprasta</div>
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
