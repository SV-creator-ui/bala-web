"use client";

import { useEffect, useRef, useState } from "react";
import { REVIEWS } from "@/lib/bala-data";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

export default function ReviewsCarousel() {
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
        aria-label="Ankstesni atsiliepimai"
        disabled={atStart}
        onClick={() => scrollBy(-1)}
        className="flex-none w-11 h-11 rounded-full border border-line-strong bg-ink-card text-white flex items-center justify-center transition-[background,border-color,transform,opacity] hover:not-disabled:bg-volt hover:not-disabled:text-volt-ink hover:not-disabled:border-volt hover:not-disabled:-translate-y-0.5 disabled:opacity-30"
      >
        <ChevronLeftIcon />
      </button>

      <div
        ref={scrollerRef}
        role="list"
        aria-label="Klientų atsiliepimai"
        className="flex-1 min-w-0 flex gap-4 overflow-x-auto no-scrollbar [scroll-snap-type:x_proximity] [overflow-anchor:none] items-stretch"
      >
        {REVIEWS.map((r) => (
          <div
            key={r.name}
            role="listitem"
            className="flex-none w-[82%] sm:basis-[320px] [scroll-snap-align:start] rounded-[18px] border border-line bg-ink-card p-7 transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-1 hover:border-volt hover:shadow-[0_0_0_1px_var(--color-volt),0_16px_34px_-12px_rgba(255,228,0,.5)]"
          >
            <div className="text-volt text-sm tracking-[2px] mb-4">★★★★★</div>
            <p className="text-[15px] leading-[1.6] text-white/88 min-h-24">{r.text}</p>
            <div className="flex items-center gap-3 mt-5.5">
              <span className="w-[38px] h-[38px] rounded-full bg-volt text-volt-ink flex items-center justify-center font-extrabold text-sm flex-none">
                {r.initial}
              </span>
              <div>
                <div className="text-sm font-bold text-white">{r.name}</div>
                <div className="text-xs text-smoke-2">{r.game}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        type="button"
        aria-label="Kiti atsiliepimai"
        disabled={atEnd}
        onClick={() => scrollBy(1)}
        className="flex-none w-11 h-11 rounded-full border border-line-strong bg-ink-card text-white flex items-center justify-center transition-[background,border-color,transform,opacity] hover:not-disabled:bg-volt hover:not-disabled:text-volt-ink hover:not-disabled:border-volt hover:not-disabled:-translate-y-0.5 disabled:opacity-30"
      >
        <ChevronRightIcon />
      </button>
    </div>
  );
}
