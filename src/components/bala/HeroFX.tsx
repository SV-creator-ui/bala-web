"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  volt: boolean;
};

/**
 * Hero fono efektų sluoksniai – dulkės (canvas), perspektyvinis tinklas,
 * švytintys rutuliai, skenerio brūkštelėjimas, pelės prožektorius ir grūdėtumas.
 * Viskas dekoratyvu: aria-hidden, pointer-events-none, gerbia prefers-reduced-motion.
 */
export default function HeroFX() {
  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Pelės prožektorius – sklandžiai seka žymeklį
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (window.matchMedia("(hover: none)").matches) return;

    let raf = 0;
    let tx = 0;
    let ty = 0;
    let cx = 0;
    let cy = 0;
    let seeded = false;

    const tick = () => {
      cx += (tx - cx) * 0.12;
      cy += (ty - cy) * 0.12;
      root.style.setProperty("--mx", `${cx}px`);
      root.style.setProperty("--my", `${cy}px`);
      raf =
        Math.abs(tx - cx) > 0.5 || Math.abs(ty - cy) > 0.5
          ? requestAnimationFrame(tick)
          : 0;
    };

    const onMove = (e: PointerEvent) => {
      const rect = root.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const inside = x >= 0 && y >= 0 && x <= rect.width && y <= rect.height;
      root.style.setProperty("--m-on", inside ? "1" : "0");
      if (!inside) return;
      tx = x;
      ty = y;
      if (!seeded) {
        cx = tx;
        cy = ty;
        seeded = true;
      }
      if (!raf) raf = requestAnimationFrame(tick);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Plaukiančios dulkės / kibirkštys
  useEffect(() => {
    const root = rootRef.current;
    const canvas = canvasRef.current;
    if (!root || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let parts: Particle[] = [];
    let raf = 0;
    let visible = true;
    let t = 0;

    const spawn = (anywhere: boolean): Particle => ({
      x: Math.random() * w,
      y: anywhere ? Math.random() * h : h + 12,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.12,
      vy: -(Math.random() * 0.2 + 0.05),
      a: Math.random() * 0.45 + 0.14,
      volt: Math.random() < 0.34,
    });

    const resize = () => {
      const rect = root.getBoundingClientRect();
      w = Math.round(rect.width);
      h = Math.round(rect.height);
      if (w === 0 || h === 0) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(80, Math.max(24, (w * h) / 17000)));
      parts = Array.from({ length: count }, () => spawn(true));
    };

    const draw = () => {
      raf = 0;
      if (!visible || w === 0) return;
      t += 0.006;
      ctx.clearRect(0, 0, w, h);

      for (const p of parts) {
        p.y += p.vy;
        p.x += p.vx + Math.sin(p.y * 0.01 + t) * 0.1;

        if (p.y < -12) Object.assign(p, spawn(false));
        if (p.x < -12) p.x = w + 12;
        else if (p.x > w + 12) p.x = -12;

        const twinkle = 0.6 + 0.4 * Math.sin(t * 3 + p.x * 0.05);
        const alpha = p.a * twinkle;

        if (p.volt) {
          // minkštas oreolas be brangaus shadowBlur
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 3.4, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255,228,0,${alpha * 0.13})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.volt
          ? `rgba(255,228,0,${alpha})`
          : `rgba(255,255,255,${alpha * 0.65})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const start = () => {
      if (!raf && visible) raf = requestAnimationFrame(draw);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const ro = new ResizeObserver(() => {
      resize();
      start();
    });
    ro.observe(root);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting && !document.hidden;
        if (visible) start();
        else stop();
      },
      { threshold: 0 },
    );
    io.observe(root);

    const onVisibility = () => {
      visible = !document.hidden;
      if (visible) start();
      else stop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    resize();
    start();

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div
      ref={rootRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden [--m-on:0] [--mx:50%] [--my:38%]"
    >
      {/* Švytintys rutuliai – lėtas gylio judesys */}
      <div className="animate-fx-orb-a absolute -top-[20%] -left-[12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(255,228,0,.9),transparent_65%)] opacity-[.26] blur-[110px]" />
      <div className="animate-fx-orb-b absolute top-[26%] -right-[14%] h-[560px] w-[560px] rounded-full bg-[radial-gradient(circle,rgba(46,190,240,.85),transparent_65%)] opacity-[.18] blur-[120px]" />

      {/* Perspektyvinis tinklas – VR portalo pojūtis */}
      <div className="absolute inset-x-0 bottom-0 h-[48%] [mask-image:linear-gradient(to_top,#000_0%,transparent_92%)] [perspective:520px]">
        <div className="fx-grid animate-fx-grid absolute inset-x-[-50%] bottom-0 h-[240%] origin-bottom [transform:rotateX(75deg)]" />
      </div>

      {/* Plaukiančios dulkės */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      {/* Skenerio brūkštelėjimas */}
      <div className="animate-fx-sweep absolute inset-0 bg-[linear-gradient(100deg,transparent_38%,rgba(255,228,0,.06)_47%,rgba(255,255,255,.03)_53%,transparent_62%)]" />

      {/* Pelės prožektorius */}
      <div
        className="absolute inset-0 bg-[radial-gradient(360px_circle_at_var(--mx)_var(--my),rgba(255,228,0,.10),transparent_70%)] transition-opacity duration-500"
        style={{ opacity: "var(--m-on)" }}
      />

      {/* Vinjetė – kad tekstas liktų skaitomas */}
      <div className="absolute inset-0 bg-[radial-gradient(125%_90%_at_50%_32%,transparent_38%,rgba(11,11,11,.6)_100%)]" />

      {/* Kino grūdėtumas */}
      <div className="fx-grain absolute inset-0 opacity-[.05] mix-blend-overlay" />
    </div>
  );
}
