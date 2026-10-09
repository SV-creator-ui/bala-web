"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { trackInquiryLead } from "@/lib/analytics";

type Kind = "imone" | "mokykla";
type Status = "idle" | "sending" | "sent" | "error";

const INPUT =
  "w-full rounded-xl border border-line-strong bg-white/[0.04] px-4 py-3 text-[16px] text-white placeholder:text-white/40 outline-none transition-colors focus:border-volt";

function Field({ label, optional, children }: { label: string; optional?: boolean; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[14px] font-semibold text-white">
        {label}
        {optional && <span className="ml-1.5 font-normal text-smoke-2">(neprivaloma)</span>}
      </span>
      {children}
    </label>
  );
}

export default function GroupInquiryForm({ kind }: { kind: Kind }) {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");
  const [format, setFormat] = useState<"pas_mus" | "i_mokykla">("pas_mus");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind,
          format: kind === "mokykla" ? format : undefined,
          name: fd.get("name"),
          phone: fd.get("phone"),
          email: fd.get("email"),
          organization: fd.get("organization"),
          participants: fd.get("participants"),
          age: fd.get("age"),
          date: fd.get("date"),
          invoice: fd.get("invoice") === "on",
          comment: fd.get("comment"),
          website: fd.get("website"),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Nepavyko išsiųsti užklausos.");
      setStatus("sent");
      trackInquiryLead(kind);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Nepavyko išsiųsti užklausos.");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-3xl border border-volt/50 bg-volt/[0.08] p-6 md:p-8 text-center">
        <p className="font-display uppercase text-[26px] leading-[1.1] text-white">Ačiū, užklausa gauta!</p>
        <p className="mt-3 text-[16px] leading-[1.6] text-smoke">
          Susisieksime su jumis ir pasiūlysime programą bei kainą. Jei skubate — skambinkite{" "}
          <a href="tel:+37068426686" className="font-semibold text-white underline underline-offset-4">
            +370 684 26686
          </a>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="rounded-3xl border border-line-strong bg-ink-card p-5 md:p-8 flex flex-col gap-4">
      {kind === "mokykla" && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1.5 text-[14px] font-semibold text-white">Kur vyks renginys?</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                ["pas_mus", "Klasė atvyksta į BALA VR"],
                ["i_mokykla", "BALA VR atvyksta į mokyklą"],
              ] as const
            ).map(([value, label]) => (
              <label
                key={value}
                className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-[15px] font-semibold transition-colors ${
                  format === value ? "border-volt bg-volt/[0.08] text-white" : "border-line-strong text-smoke hover:border-white/40"
                }`}
              >
                <input
                  type="radio"
                  name="format"
                  value={value}
                  checked={format === value}
                  onChange={() => setFormat(value)}
                  className="accent-[#ffe400]"
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Dalyvių skaičius">
          <input name="participants" inputMode="numeric" placeholder="pvz. 20" className={INPUT} />
        </Field>
        <Field label="Pageidaujama data" optional>
          <input name="date" placeholder="pvz. gruodžio 12 d. vakare" className={INPUT} />
        </Field>
      </div>

      {kind === "mokykla" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Mokinių amžius ar klasė" optional>
            <input name="age" placeholder="pvz. 6 klasė" className={INPUT} />
          </Field>
          <Field label="Mokykla ir miestas" optional={format === "pas_mus"}>
            <input name="organization" required={format === "i_mokykla"} placeholder="pvz. Klaipėdos ... progimnazija" className={INPUT} />
          </Field>
        </div>
      ) : (
        <Field label="Įmonė" optional>
          <input name="organization" autoComplete="organization" className={INPUT} />
        </Field>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vardas">
          <input name="name" required autoComplete="name" className={INPUT} />
        </Field>
        <Field label="Telefonas">
          <input name="phone" required type="tel" autoComplete="tel" placeholder="+370" className={INPUT} />
        </Field>
      </div>
      <Field label="El. paštas" optional>
        <input name="email" type="email" autoComplete="email" className={INPUT} />
      </Field>
      <Field label="Komentaras" optional>
        <textarea
          name="comment"
          rows={3}
          placeholder={kind === "imone" ? "Proga, pageidavimai, vaišės…" : "Proga, pageidavimai, lydinčių mokytojų skaičius…"}
          className={`${INPUT} resize-y`}
        />
      </Field>

      {kind === "imone" && (
        <label className="flex cursor-pointer items-center gap-3 text-[15px] text-smoke">
          <input type="checkbox" name="invoice" className="h-5 w-5 accent-[#ffe400]" />
          Reikės sąskaitos faktūros įmonei
        </label>
      )}

      {/* Honeypot — žmonėms nematomas */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

      {status === "error" && (
        <p role="alert" className="rounded-xl border border-red-400/40 bg-red-500/10 px-4 py-3 text-[15px] text-red-200">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-volt px-7 py-4 text-[16px] font-bold text-volt-ink transition-[transform,background] hover:-translate-y-0.5 hover:bg-volt-deep disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {status === "sending" ? "Siunčiama…" : kind === "imone" ? "Gauti pasiūlymą kolektyvui" : "Siųsti užklausą"}
      </button>
      <p className="text-center text-[13px] text-smoke-2">
        Užklausa jūsų niekuo neįpareigoja. Arba skambinkite{" "}
        <a href="tel:+37068426686" className="font-semibold text-white">
          +370 684 26686
        </a>
      </p>
    </form>
  );
}
