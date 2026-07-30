"use client";

import { useEffect, useRef, useState } from "react";
import { PROCESS_STEPS } from "@/lib/bala-data";
import {
  CalendarIcon,
  ChatIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExcitedFaceIcon,
  HeadsetIcon,
  PeopleGreetIcon,
} from "./icons";

const ICONS = {
  calendar: CalendarIcon,
  people: PeopleGreetIcon,
  headset: HeadsetIcon,
  face: ExcitedFaceIcon,
  chat: ChatIcon,
};

export default function ProcessCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const update = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft >= max - 4);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  return (
    <div className="flex items-center gap-2.5">
      <button
        type="button"
        aria-label="Ankstesni žingsniai"
        disabled={atStart}
        onClick={() => scrollBy(-1)}
        className="flex-none w-11 h-11 rounded-full border border-paper-ink/20 bg-white/70 backdrop-blur-md text-paper-ink flex items-center justify-center transition-[background,border-color,transform,opacity] hover:not-disabled:bg-paper-ink hover:not-disabled:text-white hover:not-disabled:-translate-y-0.5 disabled:opacity-30"
      >
        <ChevronLeftIcon />
      </button>

      <div
        ref={scrollerRef}
        role="list"
        aria-label="Kaip vyksta žingsniai"
        className="flex-1 min-w-0 flex gap-4 overflow-x-auto no-scrollbar [scroll-snap-type:x_proximity] [overflow-anchor:none] items-stretch"
      >
        {PROCESS_STEPS.map((step) => {
          const Icon = ICONS[step.icon];
          return (
            <article
              key={step.num}
              role="listitem"
              className={`flex-none w-[82%] sm:basis-[290px] [scroll-snap-align:start] rounded-[20px] border p-[26px_24px] flex flex-col gap-3 backdrop-blur-lg transition-[transform,box-shadow] hover:-translate-y-1 hover:shadow-[0_24px_44px_-26px_rgba(21,19,14,.28)] ${
                step.active
                  ? "bg-white/50 border-2 border-volt"
                  : "bg-white/45 border-white/70"
              }`}
            >
              <div className="flex items-start justify-between">
                <span className="font-display font-normal text-[40px] leading-none text-paper-ink/14">
                  {step.num}
                </span>
                <span className="text-[#B58C00] flex-none">
                  <Icon className="w-[30px] h-[30px]" />
                </span>
              </div>
              <h3 className="font-display text-[17px] uppercase text-paper-ink">{step.title}</h3>
              <p className="text-[13.5px] leading-[1.55] flex-1 text-paper-ink/62">{step.desc}</p>
              <span className="text-[11px] font-extrabold uppercase tracking-wide pt-3 border-t text-[#B58C00] border-paper-ink/10">
                {step.meta}
              </span>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        aria-label="Kiti žingsniai"
        disabled={atEnd}
        onClick={() => scrollBy(1)}
        className="flex-none w-11 h-11 rounded-full border border-paper-ink/20 bg-white/70 backdrop-blur-md text-paper-ink flex items-center justify-center transition-[background,border-color,transform,opacity] hover:not-disabled:bg-paper-ink hover:not-disabled:text-white hover:not-disabled:-translate-y-0.5 disabled:opacity-30"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
