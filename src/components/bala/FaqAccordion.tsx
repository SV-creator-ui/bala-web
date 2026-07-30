"use client";

import { useState } from "react";
import { FAQ_ITEMS } from "@/lib/bala-data";

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="max-w-[760px]">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className={`border-t border-line ${i === FAQ_ITEMS.length - 1 ? "border-b" : ""}`}>
            <button
              type="button"
              aria-expanded={open}
              onClick={() => setOpenIndex(open ? null : i)}
              className="group w-full text-left flex items-center justify-between gap-5 py-6 px-1 cursor-pointer"
            >
              <span className="font-display text-[clamp(17px,2vw,20px)] text-white normal-case">{item.q}</span>
              <span
                className={`flex-none w-8 h-8 rounded-full border flex items-center justify-center relative transition-colors ${
                  open ? "bg-volt border-volt" : "border-line-strong group-hover:border-volt"
                }`}
              >
                <span
                  className={`absolute w-3 h-0.5 transition-colors ${
                    open ? "bg-volt-ink" : "bg-white group-hover:bg-volt"
                  }`}
                />
                <span
                  className={`absolute w-0.5 h-3 transition-[transform,background-color] ${
                    open ? "bg-volt-ink scale-y-0 rotate-90" : "bg-white group-hover:bg-volt"
                  }`}
                />
              </span>
            </button>
            <div
              className="overflow-hidden transition-[max-height] duration-300 ease-[cubic-bezier(.16,.84,.32,1)]"
              style={{ maxHeight: open ? "300px" : "0px" }}
            >
              <p className="px-1 pb-6 text-[15px] leading-[1.65] text-smoke max-w-[640px]">{item.a}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
