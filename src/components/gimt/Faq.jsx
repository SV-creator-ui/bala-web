"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Nuo kokio amžiaus galima žaisti VR?",
    a: "VR žaidimai - nuo 7 metų. Arkadiniai žaidimai — nuo mažesnio amžiaus. Instruktorius visada padeda ir prižiūri.",
  },
  {
    q: "Ar tėvai taip pat gali žaisti VR?",
    a: "Tėvai gali išbandyti VR komandinius žaidimus, jei lieka laisva vieta. Jei norima žaisti be pertraukų - reikia užsakyti VR MAX papildymą.",
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
    a: "Kiekvienos šventės metu dirba mūsų instruktorius — jis padeda užsidėti VR akinius, paaiškina žaidimo taisykles, prižiūri ir seka laiką.",
  },
  {
    q: "Ką daryti, jei vaikų bus daugiau nei planuota?",
    a: "Rekomenduojame laikytis nurodyto žaidėjų skaičiaus, jog žaidėjams netektų ilgai laukti savo eilės. Taip pat galima užsakyti papildomus VR akinius. 1 VR akiniai - 20 eur.",
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
