"use client";

import { useEffect } from "react";

// Adds a fade-in-on-scroll effect to cards, steps, price cards and testimonials,
// mirroring the IntersectionObserver behaviour of the original static page.
export default function ScrollReveal() {
  useEffect(() => {
    // Atsiliepimų kortelės animuojamos atskirai (Testimonials.jsx), todėl jas praleidžiame.
    const targets = document.querySelectorAll(
      ".card:not(.testimonial), .how-step, .price-card"
    );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      targets.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    targets.forEach((el) => el.classList.add("reveal"));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    targets.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return null;
}
