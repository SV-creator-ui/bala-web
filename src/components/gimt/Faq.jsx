"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Nuo kokio amžiaus galima žaisti VR?",
    a: "VR žaidimams rekomenduojame nuo 7 metų. Arkadiniai žaidimai — nuo mažesnio amžiaus. Instruktorius visada padeda ir prižiūri.",
  },
  {
    q: "Ar tėvai taip pat gali žaisti VR?",
    a: "Taip! Tėvai gali išbandyti VR ausinukus, jei lieka laisva vieta. Dauguma tėvų renkasi ilsėtis lounge zonoje — ir tai labai gerai supranta.",
  },
  {
    q: "Ar galime atsivežti tortą ir dekoracijas?",
    a: "Žinoma! Galite atsivežti savo tortą, gėrimų, dekoracijų. Mes pasirūpiname stalais ir erdve. Tereikia pranešti iš anksto.",
  },
  {
    q: "Kiek iš anksto reikia rezervuoti?",
    a: "Savaitgalių laikas užpildomas 2–3 savaitės iš anksto. Darbo dienos — dažnai pasiekiamos trumpesniam laikotarpiui. Rezervuokite kuo greičiau.",
  },
  {
    q: "Kas prižiūri vaikus šventės metu?",
    a: "Kiekvienos šventės metu dirba mūsų instruktorius — jis padeda apsirengti ausinukus, aiškina žaidimo taisykles, prižiūri saugumą ir seka laiką.",
  },
  {
    q: "Ką daryti, jei vaikų bus daugiau nei planuota?",
    a: "Paskambinkite kuo anksčiau — mes pasistengime surasti sprendimą. Maksimalus talpa — 23 žaidėjai vienu metu. Papildomi svečiai gali laukti lounge zonoje.",
  },
];

export default function Faq() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggle = (i) => setOpenIndex((prev) => (prev === i ? null : i));

  return (
    <section className="faq section" id="duk">
      <div className="container">
        <div className="label">Dažni klausimai</div>
        <h2 className="section-heading">Atsakymai tėvams</h2>
        <div className="faq-grid">
          {faqs.map((item, i) => (
            <div
              className={`faq-item${openIndex === i ? " open" : ""}`}
              key={item.q}
            >
              <button
                className="faq-q"
                onClick={() => toggle(i)}
                aria-expanded={openIndex === i}
              >
                {item.q}
                <span className="faq-icon">+</span>
              </button>
              <div className="faq-a">
                <div className="faq-a-inner">{item.a}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
