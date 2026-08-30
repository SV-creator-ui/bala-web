"use client";

import { useState } from "react";

export default function AdminLogin({ demo }: { demo: boolean }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Nepavyko prisijungti");
      }
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Klaida");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-[420px] flex-col justify-center px-6">
      <div className="mb-6 flex items-center gap-3">
        <span className="font-display text-2xl bg-volt text-volt-ink px-3 py-1 rounded-lg">BALA</span>
        <span className="font-mono text-xs uppercase tracking-[0.18em] text-smoke-2">Admin skydelis</span>
      </div>
      <h1 className="font-display text-3xl uppercase mb-2">Prisijungimas</h1>
      {demo && (
        <p className="mb-5 rounded-lg border border-volt/40 bg-volt/10 px-4 py-3 text-sm text-smoke">
          <b className="text-volt">DEMO režimas</b> — duomenų bazė dar nesukonfigūruota. Slaptažodis: <code className="text-white">demo</code>. Duomenys pavyzdiniai.
        </p>
      )}
      <form onSubmit={submit} className="flex flex-col gap-3">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Slaptažodis"
          autoFocus
          className="rounded-xl border border-line bg-ink-card px-4 py-3 text-white focus:outline-none focus:border-volt"
        />
        {error && <p className="text-sm font-semibold text-genre-pink">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="rounded-xl bg-volt px-6 py-3.5 font-bold text-volt-ink transition hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
        >
          {loading ? "Jungiamasi…" : "Prisijungti"}
        </button>
      </form>
    </div>
  );
}
