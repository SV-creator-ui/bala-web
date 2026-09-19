"use client";

import { useState } from "react";

const faqs = [
  {
    q: "Nuo kokio amžiaus galima žaisti VR?",
    a: "VR žaidimai – nuo 7 metų. Arkadiniai žaidimai – nuo mažesnio amžiaus. Instruktorius visada padeda ir prižiūri.",
  },
  {
    q: "Ar tėvai taip pat gali žaisti VR?",
    a: "Tėvai gali išbandyti VR veiksmo žaidimus, jei lieka laisva vieta. Jei norima intensyvesnio VR tempo – galima pasirinkti VR MAX (+25 €): trumpesnės pauzės tarp VR sesijų ir daugiau šventės laiko žaidimams.",
  },
  {
    q: "Ar galime atsivežti tortą ir dekoracijas?",
    a: "Žinoma! Galite atsivežti arba užsisakyti maistą, tortą, gėrimų, pasipuošti dekoracijas.",
  },
  {
    q: "Ar visi žaidėjai turės veiklos?",
    a: "Taip. Kol viena komanda žaidžia VR, kita renkasi interaktyvią sieną, arkadinius (stalo) žaidimus, vairavimo simuliatorių arba vaišinasi. Komandos reguliariai keičiasi.",
  },
  {
    q: "Kas prižiūri vaikus šventės metu?",
    a: "Kiekvienos šventės metu dirba mūsų instruktorius — jis padeda užsidėti VR akinius, paaiškina žaidimo taisykles ir seka laiką. Už vaikų taisyklių laikymąsi atsako tėvai.",
  },
  {
    q: "Ką daryti, jei norisi intensyvesnio VR tempo?",
    a: "Galite pasirinkti VR MAX (+25 €) — intensyvesnį VR tempą su trumpesnėmis pauzėmis ir daugiau žaidimo laiko. Dalyvių limitas išlieka pagal paketą (MAKSI 14, VIP 15, GOLD 16 žaidėjų).",
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
