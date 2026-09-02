"use client";

/**
 * Dovanų kupono pirkimo forma. Klientas pasirenka vertę (fiksuotą arba savo),
 * įveda pirkėjo duomenis ir (neprivaloma) personalizaciją, apmoka per Montonio.
 * Apmokėjus PDF kuponas atkeliauja į pirkėjo el. paštą.
 */
import { useState } from "react";
import { VOUCHER_PRESETS, VOUCHER_MIN, VOUCHER_MAX } from "@/lib/voucher/config";
import { validName, validEmail } from "@/lib/booking/validation";
import { formatEur } from "@/lib/booking/pricing";

export default function VoucherPurchase() {
  const [preset, setPreset] = useState<number | "custom">(VOUCHER_PRESETS[1]); // 50 €
  const [customAmount, setCustomAmount] = useState("");
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [gift, setGift] = useState(false);
  const [recipientName, setRecipientName] = useState("");
  const [fromName, setFromName] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amount = preset === "custom" ? Math.floor(Number(customAmount)) : preset;
  const amountOk = Number.isInteger(amount) && amount >= VOUCHER_MIN && amount <= VOUCHER_MAX;
  const nameOk = validName(buyerName);
  const emailOk = validEmail(buyerEmail);
  const canSubmit = amountOk && nameOk && emailOk && agreed && !submitting;

  async function submit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/vouchers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          buyerName,
          buyerEmail,
          recipientName: gift ? recipientName : null,
          fromName: gift ? fromName : null,
          message: gift ? message : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepavyko sukurti kupono");
      window.location.href = data.paymentUrl; // į Montonio apmokėjimą
    } catch (e) {
      setError(e instanceof Error ? e.message : "Įvyko klaida");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_320px] items-start">
      <div>
        {/* Vertė */}
        <h2 className="font-display text-2xl uppercase mb-1">Kupono vertė</h2>
        <p className="text-sm text-smoke mb-4">Pasirinkite vertę arba įveskite savo ({VOUCHER_MIN}–{VOUCHER_MAX} €).</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-[560px]">
          {VOUCHER_PRESETS.map((p) => {
            const on = preset === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPreset(p)}
                className={`rounded-2xl border px-4 py-5 text-center transition ${
                  on ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"
                }`}
              >
                <span className="font-display text-2xl">{p} €</span>
              </button>
            );
          })}
        </div>
        <div className="mt-3 max-w-[560px]">
          <button
            type="button"
            onClick={() => setPreset("custom")}
            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-4 text-left transition ${
              preset === "custom" ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"
            }`}
          >
            <span className="font-semibold">Kita suma</span>
            <span className="relative ml-auto flex items-center">
              <input
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value.replace(/[^\d]/g, "")); setPreset("custom"); }}
                inputMode="numeric"
                placeholder="pvz. 120"
                className="w-28 rounded-lg border border-line bg-ink px-3 py-2 text-right text-white focus:outline-none focus:border-volt"
              />
              <span className="ml-2 font-display text-lg">€</span>
            </span>
          </button>
          {preset === "custom" && customAmount && !amountOk && (
            <p className="mt-1.5 text-[12.5px] font-semibold text-genre-pink">
              Suma turi būti nuo {VOUCHER_MIN} iki {VOUCHER_MAX} €.
            </p>
          )}
        </div>

        {/* Pirkėjas */}
        <h2 className="font-display text-2xl uppercase mt-9 mb-1">Jūsų duomenys</h2>
        <p className="text-sm text-smoke mb-4">Į šį el. paštą atsiųsime PDF kuponą.</p>
        <div className="grid gap-4 sm:grid-cols-2 max-w-[560px]">
          <VField label="Vardas" value={buyerName} onChange={setBuyerName}
            onBlur={() => buyerName.trim() && setTouched({ ...touched, name: true })}
            error={touched.name && !nameOk ? "Įveskite vardą" : ""} ok={!!buyerName && nameOk} placeholder="Vardenis" />
          <VField label="El. paštas" value={buyerEmail} onChange={setBuyerEmail}
            onBlur={() => buyerEmail.trim() && setTouched({ ...touched, email: true })}
            error={touched.email && !emailOk ? "Netinkamas el. paštas" : ""} ok={!!buyerEmail && emailOk}
            placeholder="tu@pastas.lt" inputMode="email" />
        </div>

        {/* Personalizacija */}
        <label className="mt-6 flex cursor-pointer items-center gap-3 max-w-[560px] rounded-xl border border-line bg-ink-card px-4 py-3.5">
          <input type="checkbox" checked={gift} onChange={(e) => setGift(e.target.checked)} className="h-5 w-5 cursor-pointer accent-volt" />
          <span>
            <b className="text-[15px]">Dovanoju kitam žmogui</b>
            <span className="block text-xs text-smoke-2">Įrašysime „Kam", „Nuo" ir palinkėjimą ant kupono (nebūtina).</span>
          </span>
        </label>

        {gift && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 max-w-[560px]">
            <VField label="Kam (gavėjas)" value={recipientName} onChange={setRecipientName} placeholder="Pvz. Gabija" />
            <VField label="Nuo ko" value={fromName} onChange={setFromName} placeholder="Pvz. Mama ir tėtis" />
            <div className="sm:col-span-2">
              <label className="block font-mono text-[11px] uppercase tracking-wider text-smoke-2 mb-1.5">Palinkėjimas (nebūtina)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, 300))} rows={3}
                placeholder="Su gimtadieniu! Linkime adrenalino ir smagių nuotykių BALA VR."
                className="w-full rounded-xl border border-line bg-ink-card px-3.5 py-3 text-white focus:outline-none focus:border-volt" />
            </div>
          </div>
        )}

        {/* Sutikimas */}
        <label className="mt-7 flex cursor-pointer items-start gap-3 text-sm max-w-[560px]">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-volt" />
          <span className="text-smoke">
            Susipažinau su{" "}
            <a href="/taisykles" target="_blank" rel="noreferrer" className="font-semibold text-volt underline underline-offset-2 hover:opacity-80">BALA VR taisyklėmis</a>{" "}
            ir suprantu, kad kuponas galioja 6 mėn. ir yra vienkartinis.
          </span>
        </label>

        {error && <p className="mt-4 text-sm font-semibold text-genre-pink max-w-[560px]">{error}</p>}
      </div>

      {/* Suvestinė */}
      <aside className="rounded-2xl border border-line bg-ink-card p-5 lg:sticky lg:top-5">
        <h3 className="font-mono text-xs uppercase tracking-wider text-smoke-2 mb-4">Dovanų kuponas</h3>
        <div className="flex items-center gap-3 border-b border-line pb-4 mb-4">
          <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-neutral-700 to-black text-xl">🎁</div>
          <div>
            <h4 className="font-display uppercase text-[15px] leading-tight">BALA VR kuponas</h4>
            <span className="font-mono text-xs text-smoke-2">Galioja 6 mėn.</span>
          </div>
        </div>
        <div className="mb-2.5 flex justify-between gap-2.5 text-sm">
          <span className="text-smoke">Vertė</span>
          <span className="text-right font-mono font-semibold text-white">{amountOk ? `${formatEur(amount)} €` : "—"}</span>
        </div>
        {gift && recipientName && (
          <div className="mb-2.5 flex justify-between gap-2.5 text-sm">
            <span className="text-smoke">Kam</span>
            <span className="text-right font-mono font-semibold text-white">{recipientName}</span>
          </div>
        )}
        <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
          <span className="font-display text-lg uppercase">Mokėti</span>
          <span className="font-display text-3xl tabular-nums">{amountOk ? `${formatEur(amount)} €` : "—"}</span>
        </div>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="mt-5 w-full rounded-xl bg-volt text-volt-ink font-bold px-6 py-3.5 shadow-[0_6px_18px_rgba(255,228,0,.35)] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {submitting ? "Palaukite…" : amountOk ? `Pirkti · ${formatEur(amount)} €` : "Pirkti"}
        </button>
        <p className="mt-3 text-center font-mono text-[11px] text-smoke-2">Apmokėjimas per Paysera · bankinė nuoroda</p>
      </aside>
    </div>
  );
}

function VField({ label, value, onChange, onBlur, error, ok, placeholder, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; onBlur?: () => void;
  error?: string; ok?: boolean; placeholder: string; inputMode?: "email";
}) {
  return (
    <div>
      <label className="block font-mono text-[11px] uppercase tracking-wider text-smoke-2 mb-1.5">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete="off"
        className={`w-full rounded-xl border bg-ink-card px-3.5 py-3 text-white focus:outline-none focus:border-volt ${
          error ? "border-genre-pink" : ok ? "border-genre-green/55" : "border-line"
        }`}
      />
      {error && <p className="mt-1.5 text-[12.5px] font-semibold text-genre-pink">{error}</p>}
    </div>
  );
}
