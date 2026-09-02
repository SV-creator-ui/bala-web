"use client";

/**
 * Rezervacijos srautas — bendras VR pabėgimo kambariui IR gimtadienio/šventės
 * paketams (vienas grafikas). 5 žingsniai:
 *   Tipas → Laikas → Dalyviai → Kontaktai → Apmokėjimas.
 * Kaina ir avansas rodomi iš @/lib/booking (tas pats šaltinis kaip serveryje).
 */
import { useEffect, useMemo, useState } from "react";
import { BOOKING, ADDONS, depositFor, toHHMM, type BookingType } from "@/lib/booking/config";
import { activityEndMin } from "@/lib/booking/window";
import { roomsPrice, gamesPrice, grandTotal, formatEur } from "@/lib/booking/pricing";
import {
  PARTY_PACKAGES, PARTY_EXTRAS, getPartyPackage,
  partyTotal, partyDiscount, isDiscountDay,
  type PartyPackageId,
} from "@/lib/booking/packages";
import { isClosedHoliday } from "@/lib/booking/holidays";
import { validName, validPhone, validEmail } from "@/lib/booking/validation";

type SlotStatus = { time: string; available: boolean };

// Rezervacijos fazės. Įprastam VR pabėgimo kambariui (room) "type" fazės nėra —
// pirmas žingsnis iškart yra laikas. Šventės paketams (party) pirmas žingsnis
// išlieka paketo pasirinkimas.
type Phase = "type" | "date" | "players" | "contact" | "payment";
const PHASE_LABEL: Record<Phase, string> = {
  type: "Tipas",
  date: "Laikas",
  players: "Žaidėjai",
  contact: "Kontaktai",
  payment: "Apmokėjimas",
};

const MONTHS = ["Sausis","Vasaris","Kovas","Balandis","Gegužė","Birželis","Liepa","Rugpjūtis","Rugsėjis","Spalis","Lapkritis","Gruodis"];
const MONTHS_GEN = ["sausio","vasario","kovo","balandžio","gegužės","birželio","liepos","rugpjūčio","rugsėjo","spalio","lapkričio","gruodžio"];
const WD = ["Sk","Pr","An","Tr","Kt","Pn","Št"];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export default function BookingFlow({ initialType, initialPkgId }: {
  initialType?: BookingType;
  initialPkgId?: string;
}) {
  // Iš anksto parinktas paketas (tik jei tipas — party ir paketas galiojantis)
  const initialPkg = initialType === "party"
    ? PARTY_PACKAGES.find((x) => x.id === initialPkgId)?.id ?? null
    : null;

  const today = useMemo(() => startOfDay(new Date()), []);
  const [viewMonth, setViewMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));

  // Kambariui ir komandiniams žaidimams tipo/paketo fazės nėra — pirmas žingsnis laikas.
  const roomOnly = initialType === "room" || initialType === "game";
  const phases: Phase[] = roomOnly
    ? ["date", "players", "contact", "payment"]
    : ["type", "date", "players", "contact", "payment"];
  const lastStep = phases.length;

  // Pradinis žingsnis: room — iškart laikas (1). Party su jau žinomu paketu —
  // peršokam paketo pasirinkimą (laikas = 2). Kitaip pradedam nuo pradžios.
  const [step, setStep] = useState(() => {
    if (roomOnly) return 1;
    if (initialType === "party" && initialPkg) return 2;
    return 1;
  });
  const phase: Phase = phases[step - 1];

  const [type, setType] = useState<BookingType | null>(initialType ?? null);
  const [typeLocked] = useState(!!initialType); // tipas parinktas iš URL (nerodom tipo kortelių)
  const [pkgId, setPkgId] = useState<PartyPackageId | null>(initialPkg);
  const [partyExtras, setPartyExtras] = useState<string[]>([]);

  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [slots, setSlots] = useState<SlotStatus[] | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);

  const [players, setPlayers] = useState<number>(BOOKING.minPlayers);
  const [addons, setAddons] = useState<string[]>([]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState({ name: false, phone: false, email: false });

  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dovanų kuponas (neprivalomas)
  const [voucherInput, setVoucherInput] = useState("");
  const [voucherCode, setVoucherCode] = useState<string | null>(null); // pritaikytas kodas
  const [voucherAmount, setVoucherAmount] = useState(0);
  const [voucherMsg, setVoucherMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [voucherChecking, setVoucherChecking] = useState(false);

  const pkg = type === "party" && pkgId ? getPartyPackage(pkgId) : undefined;

  // Kai keičiasi paketas — dalyvių skaičių laikom paketo ribose
  useEffect(() => {
    if (type === "party" && pkg) {
      setPlayers((p) => Math.min(Math.max(1, p), pkg.maxPlayers));
    } else if (type === "room" || type === "game") {
      setPlayers((p) => Math.min(Math.max(BOOKING.minPlayers, p), BOOKING.maxPlayers));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, pkgId]);

  // Priedai, kurie eina į kainą / grafiką pagal tipą
  const activeAddons = type === "party" ? partyExtras : addons;
  const addonsKey = activeAddons.join(",");

  // Užkrauname laisvus laikus, kai turim tipą + datą (ir kai keičiasi trukmė)
  useEffect(() => {
    if (!date || !type || (type === "party" && !pkgId)) return;
    let cancelled = false;
    setSlotsLoading(true);
    setSlots(null);
    const params = new URLSearchParams({ date, type });
    if (type === "party" && pkgId) params.set("pkg", pkgId);
    if (addonsKey) params.set("addons", addonsKey);
    fetch(`/api/availability?${params.toString()}`)
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        const list: SlotStatus[] = d.slots ?? [];
        setSlots(list);
        // Jei pasirinktas laikas nebeliko laisvas — išvalome
        setTime((t) => (t && list.some((s) => s.time === t && s.available) ? t : null));
      })
      .catch(() => { if (!cancelled) setSlots([]); })
      .finally(() => { if (!cancelled) setSlotsLoading(false); });
    return () => { cancelled = true; };
  }, [date, type, pkgId, addonsKey]);

  // Kainos. „rooms" — kaina už patį žaidimą (kambarys arba komandiniai žaidimai).
  const deposit = type ? depositFor(type) : 0;
  const rooms = type === "room" ? roomsPrice(players) : type === "game" ? gamesPrice(players) : 0;
  const total = type === "party" && pkg && date
    ? partyTotal(pkg, date, partyExtras)
    : type === "room"
    ? grandTotal(players, addons)
    : type === "game"
    ? gamesPrice(players)
    : 0;

  // Kupono pritaikymas: taikomas visai sumai; jei padengia avansą — online 0 €.
  const voucherDiscount = voucherCode ? Math.min(voucherAmount, total) : 0;
  const effectiveTotal = Math.max(0, total - voucherDiscount);
  const onlineDue = Math.min(deposit, effectiveTotal);
  const onSite = effectiveTotal - onlineDue;

  async function applyVoucher() {
    const code = voucherInput.trim();
    if (!code) return;
    setVoucherChecking(true);
    setVoucherMsg(null);
    try {
      const res = await fetch("/api/vouchers/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const d = await res.json();
      if (d.valid) {
        setVoucherCode(code);
        setVoucherAmount(Number(d.amount) || 0);
        setVoucherMsg({ ok: true, text: `Kuponas pritaikytas: −${formatEur(Math.min(Number(d.amount) || 0, total))} €` });
      } else {
        setVoucherCode(null);
        setVoucherAmount(0);
        setVoucherMsg({ ok: false, text: d.error || "Kuponas negalioja" });
      }
    } catch {
      setVoucherMsg({ ok: false, text: "Nepavyko patikrinti kodo" });
    } finally {
      setVoucherChecking(false);
    }
  }
  function clearVoucher() {
    setVoucherCode(null);
    setVoucherAmount(0);
    setVoucherMsg(null);
    setVoucherInput("");
  }

  function canProceed(): boolean {
    switch (phase) {
      case "type": return type === "room" || type === "game" || (type === "party" && !!pkgId);
      case "date": return !!(date && time);
      case "players": return players >= 1;
      case "contact": return validName(name) && validPhone(phone) && validEmail(email);
      case "payment": return agreed;
      default: return false;
    }
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, packageId: pkgId, date, time, players,
          addons: activeAddons, name, phone, email, note,
          voucherCode: voucherCode || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Nepavyko sukurti rezervacijos");
      window.location.href = data.paymentUrl; // į Montonio apmokėjimą
    } catch (e) {
      setError(e instanceof Error ? e.message : "Įvyko klaida");
      setSubmitting(false);
    }
  }

  function next() {
    if (!canProceed()) return;
    if (step < lastStep) setStep(step + 1);
    else submit();
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function back() {
    if (step > 1) setStep(step - 1);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Antraštė + įvadas — pilno pločio virš dviejų kolonų, kad suvestinė dešinėje
  // sulygiuotų su kairės pusės turinio blokais (paketais, kalendoriumi ir t. t.).
  const partyOnly = typeLocked && type === "party";
  const headByPhase: Record<Phase, { title: string; intro: string }> = {
    type: {
      title: partyOnly ? "Pasirinkite paketą" : "Ką rezervuojate?",
      intro: partyOnly
        ? "Pasirinkite gimtadienio / šventės paketą. Papildymus galite pridėti žemiau."
        : "Pasirinkite įprastą VR pabėgimo kambario apsilankymą arba gimtadienio / šventės paketą.",
    },
    date: {
      title: "Data ir laikas",
      intro:
        type === "party"
          ? ""
          : type === "game"
          ? "Rezervuok komandinių VR žaidimų laiką. 3 žaidimai, ~45 min."
          : "Rezervuok VR pabėgimo kambario laiką. Konkretų scenarijų pasirinksi atvykęs.",
    },
    players: {
      title: "Žaidėjai",
      intro:
        type === "party"
          ? "Minimalus žaidėjų amžius – 7 metai. Jaunesni svečiai VR žaisti negalės."
          : type === "game"
          ? `2–${BOOKING.maxPlayers} žaidėjų. 2 žaid. – 50 €, 3 žaid. – 60 €, kiekvienas papildomas +20 €.`
          : `2–${BOOKING.maxPlayers} žaidėjų. Nuo 7 asm. žaidžiama dviem komandomis vienu metu.`,
    },
    contact: {
      title: "Tavo kontaktai",
      intro: "Į šiuos duomenis atsiųsime patvirtinimą ir priminimą prieš vizitą.",
    },
    payment: {
      title: "Apmokėjimas",
      intro: `Vietai rezervuoti sumokamas ${formatEur(deposit)} € avansas. Likutį sumokėsi vietoje.`,
    },
  };
  const head = { n: step, ...headByPhase[phase] };

  return (
    <div>
      <Steps phases={phases} step={step} />

      <div className="mt-8">
        <StepHead n={head.n} last={lastStep} title={head.title} />
        {head.intro && <p className="mt-2 max-w-[64ch] text-sm text-smoke">{head.intro}</p>}
      </div>

      <div className="mt-6 grid gap-7 lg:grid-cols-[1fr_320px] items-start">
        <div>
          {phase === "type" && (
            <StepType
              locked={typeLocked}
              type={type}
              setType={(t) => { setType(t); setTime(null); if (t === "room") setPkgId(null); }}
              pkgId={pkgId}
              setPkgId={(id) => { setPkgId(id); setTime(null); }}
              partyExtras={partyExtras}
              setPartyExtras={(a) => { setPartyExtras(a); setTime(null); }}
            />
          )}
          {phase === "date" && (
            <StepDate
              today={today}
              viewMonth={viewMonth}
              setViewMonth={setViewMonth}
              date={date}
              setDate={(d) => { setDate(d); setTime(null); }}
              time={time}
              setTime={setTime}
              slots={slots}
              slotsLoading={slotsLoading}
              type={type!}
              pkg={pkg}
              block={type === "party" && pkg && time
                ? { start: time, end: toHHMM(activityEndMin("party", time, pkgId, partyExtras)) }
                : null}
            />
          )}
          {phase === "players" && (
            <StepPlayers
              type={type!} pkg={pkg}
              players={players} setPlayers={setPlayers}
              addons={addons} setAddons={setAddons} rooms={rooms}
            />
          )}
          {phase === "contact" && (
            <StepContact
              name={name} setName={setName}
              phone={phone} setPhone={setPhone}
              email={email} setEmail={setEmail}
              note={note} setNote={setNote}
              touched={touched} setTouched={setTouched}
            />
          )}
          {phase === "payment" && (
            <StepPayment
              deposit={deposit}
              onlineDue={onlineDue}
              onSite={onSite}
              voucherDiscount={voucherDiscount}
              error={error}
              agreed={agreed}
              setAgreed={setAgreed}
              voucher={{
                input: voucherInput,
                setInput: setVoucherInput,
                applied: voucherCode,
                checking: voucherChecking,
                msg: voucherMsg,
                apply: applyVoucher,
                clear: clearVoucher,
              }}
            />
          )}
        </div>

        <Summary
          phase={phase}
          type={type}
          pkg={pkg}
          date={date}
          time={time}
          players={players}
          addons={addons}
          partyExtras={partyExtras}
          rooms={rooms}
          total={total}
          deposit={deposit}
        />
      </div>

      <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-6">
        <button
          onClick={back}
          className={`text-smoke hover:text-white font-bold ${step === 1 ? "invisible" : ""}`}
        >
          ‹ Atgal
        </button>
        <button
          onClick={next}
          disabled={!canProceed() || submitting}
          className="rounded-xl bg-volt text-volt-ink font-bold px-7 py-3.5 shadow-[0_6px_18px_var(--btn-glow,rgba(255,228,0,.35))] transition hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0 disabled:shadow-none disabled:cursor-not-allowed"
        >
          {submitting
            ? "Palaukite…"
            : step === lastStep
            ? onlineDue > 0
              ? `Sumokėti ${formatEur(onlineDue)} € ›`
              : "Patvirtinti rezervaciją ›"
            : "Toliau ›"}
        </button>
      </div>
    </div>
  );
}

/* ---------------- Progress ---------------- */
function Steps({ phases, step }: { phases: Phase[]; step: number }) {
  return (
    <div className="flex flex-wrap items-center">
      {phases.map((p, i) => {
        const n = i + 1;
        const active = step === n;
        const done = step > n;
        return (
          <div key={p} className="flex items-center">
            <div className={`flex items-center gap-2 ${active || done ? "opacity-100" : "opacity-40"}`}>
              <span
                className={`grid h-7 w-7 place-items-center rounded-full border-2 text-xs font-bold ${
                  active ? "border-volt bg-volt text-volt-ink" : done ? "border-genre-green text-genre-green" : "border-line-strong text-smoke"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className="hidden sm:inline text-[12.5px] font-semibold">{PHASE_LABEL[p]}</span>
            </div>
            {n < phases.length && <span className="mx-2 h-0.5 w-5 bg-line" />}
          </div>
        );
      })}
    </div>
  );
}

/* ---------------- Step 1: Type + package ---------------- */
function StepType({ locked, type, setType, pkgId, setPkgId, partyExtras, setPartyExtras }: {
  locked: boolean; type: BookingType | null; setType: (t: BookingType) => void;
  pkgId: PartyPackageId | null; setPkgId: (id: PartyPackageId) => void;
  partyExtras: string[]; setPartyExtras: (a: string[]) => void;
}) {
  // Kai tipas parinktas iš URL (pvz. iš gimtadienių puslapio) — nerodom tipo
  // kortelių, iškart tik paketo pasirinkimą.
  const partyOnly = locked && type === "party";

  return (
    <div>
      {!partyOnly && (
        <div className="grid gap-3 sm:grid-cols-2 max-w-[620px]">
          <TypeCard
            active={type === "room"}
            onClick={() => setType("room")}
            emoji="🥽"
            title="VR pabėgimo kambarys"
            desc="Įprastas apsilankymas 2–10 žaidėjų. Scenarijų renkatės vietoje."
          />
          <TypeCard
            active={type === "party"}
            onClick={() => setType("party")}
            emoji="🎂"
            title="Gimtadienio / šventės paketas"
            desc="Pilnas šventės paketas su vaišėms skirtu laiku ir instruktoriumi."
          />
        </div>
      )}

      {type === "party" && (
        <>
          {!partyOnly && <h3 className="font-display uppercase text-lg mt-8 mb-3">Pasirinkite paketą</h3>}
          <div className="grid gap-3 sm:grid-cols-3">
            {PARTY_PACKAGES.map((p) => {
              const on = pkgId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setPkgId(p.id)}
                  className={`flex h-full flex-col rounded-2xl border px-5 py-5 text-left transition ${
                    on ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"
                  }`}
                >
                  {/* Fiksuoto aukščio ženkliuko eilutė — kad pavadinimai visose kortelėse sutaptų */}
                  <div className="mb-2 h-[18px]">
                    {p.featured && (
                      <span className="inline-block rounded-full bg-volt/20 px-2 py-0.5 text-[10px] font-bold uppercase text-volt">
                        Populiariausias
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-display text-xl uppercase">{p.name}</span>
                    <span className="font-mono text-sm text-smoke-2 whitespace-nowrap">{p.durationLabel}</span>
                  </div>
                  <p className="mt-1 flex-1 text-[13px] text-smoke">{p.tagline}</p>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="font-display text-2xl">€{p.price}</span>
                    <span className="text-xs text-smoke-2">iki {p.maxPlayers} žaid.</span>
                  </div>
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-[12.5px] text-smoke-2">
            −{formatEur(20)} € nuolaida I–IV dienomis (pirmadienį–ketvirtadienį) — pritaikoma pasirinkus datą.
          </p>

          <h3 className="font-display uppercase text-lg mt-8 mb-3">Papildymai <span className="text-smoke-2 text-sm normal-case">(nebūtina)</span></h3>
          <div className="flex flex-col gap-2.5 max-w-[560px]">
            {PARTY_EXTRAS.map((e) => {
              const on = partyExtras.includes(e.id);
              return (
                <button
                  key={e.id}
                  onClick={() => setPartyExtras(on ? partyExtras.filter((x) => x !== e.id) : [...partyExtras, e.id])}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left ${on ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"}`}
                >
                  <span className={`grid h-5 w-5 place-items-center rounded-md border-2 text-volt-ink text-xs font-extrabold ${on ? "bg-volt border-volt" : "border-line-strong"}`}>{on ? "✓" : ""}</span>
                  <span className="flex-1">
                    <b className="text-[15px]">{e.name}</b>
                    <span className="block text-xs text-smoke-2">{e.desc}</span>
                  </span>
                  <span className="font-mono font-semibold whitespace-nowrap">+{e.price} €</span>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function TypeCard({ active, onClick, emoji, title, desc }: {
  active: boolean; onClick: () => void; emoji: string; title: string; desc: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-2 rounded-2xl border px-5 py-5 text-left transition ${
        active ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"
      }`}
    >
      <span className="text-3xl">{emoji}</span>
      <span className="font-display uppercase text-lg leading-tight">{title}</span>
      <span className="text-[13px] text-smoke">{desc}</span>
    </button>
  );
}

/* ---------------- Step 2: Date + Time ---------------- */
function StepDate({ today, viewMonth, setViewMonth, date, setDate, time, setTime, slots, slotsLoading, type, pkg, block }: {
  today: Date; viewMonth: Date; setViewMonth: (d: Date) => void;
  date: string | null; setDate: (d: string) => void;
  time: string | null; setTime: (t: string) => void;
  slots: SlotStatus[] | null; slotsLoading: boolean;
  type: BookingType; pkg: ReturnType<typeof getPartyPackage>;
  block: { start: string; end: string } | null;
}) {
  const y = viewMonth.getFullYear();
  const m = viewMonth.getMonth();
  const first = new Date(y, m, 1);
  const startDow = (first.getDay() + 6) % 7; // Pr = 0
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const prevDisabled = y === today.getFullYear() && m <= today.getMonth();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-ink-card p-4">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(new Date(y, m - 1, 1))}
              disabled={prevDisabled}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-volt disabled:opacity-30 disabled:cursor-not-allowed"
              aria-label="Ankstesnis mėnuo"
            >‹</button>
            <span className="font-display uppercase text-base">{MONTHS[m]} {y}</span>
            <button
              onClick={() => setViewMonth(new Date(y, m + 1, 1))}
              className="grid h-8 w-8 place-items-center rounded-lg border border-line hover:border-volt"
              aria-label="Kitas mėnuo"
            >›</button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-1.5">
            {["Pr","An","Tr","Kt","Pn","Št","Sk"].map((d) => (
              <span key={d} className="text-center text-[10px] font-mono text-smoke-2">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {cells.map((d, i) => {
              if (d === null) return <span key={`e${i}`} />;
              const cellDate = new Date(y, m, d);
              const iso = ymd(cellDate);
              const past = startOfDay(cellDate) < today;
              const closed = isClosedHoliday(iso); // Kalėdos — uždaryta
              const disabled = past || closed;
              const isToday = startOfDay(cellDate).getTime() === today.getTime();
              const selected = date === iso;
              const discount = type === "party" && !disabled && isDiscountDay(iso);
              return (
                <button
                  key={d}
                  onClick={() => setDate(iso)}
                  disabled={disabled}
                  className={`relative grid aspect-square place-items-center rounded-lg text-sm font-semibold transition ${
                    selected
                      ? "bg-volt text-volt-ink"
                      : disabled
                      ? `text-smoke-2 opacity-35 cursor-not-allowed ${closed ? "line-through" : ""}`
                      : "hover:bg-white/5"
                  }`}
                  title={closed ? "Kalėdos — uždaryta" : discount ? "I–IV: −20 € nuolaida" : undefined}
                >
                  {d}
                  {isToday && <span className={`absolute bottom-1 h-1 w-1 rounded-full ${selected ? "bg-volt-ink" : "bg-volt"}`} />}
                  {discount && !selected && <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-genre-green" />}
                </button>
              );
            })}
          </div>
          {type === "party" && (
            <p className="mt-2 flex items-center gap-1.5 font-mono text-[10.5px] text-smoke-2">
              <span className="h-1.5 w-1.5 rounded-full bg-genre-green" /> I–IV: −20 € nuolaida
            </p>
          )}
        </div>

        <div>
          <h4 className="font-display uppercase text-base mb-1">Laisvi seansai</h4>
          <p className="font-mono text-xs text-smoke-2 mb-3">
            {!date ? "← Pirma pasirink dieną" : fmtDateGen(date)}
          </p>
          {date && slotsLoading && <p className="text-smoke text-sm">Kraunama…</p>}
          {date && !slotsLoading && slots && (
            <div className="grid grid-cols-3 gap-2">
              {slots.map((s) => (
                <button
                  key={s.time}
                  onClick={() => s.available && setTime(s.time)}
                  disabled={!s.available}
                  className={`rounded-lg border py-2.5 text-sm font-semibold transition ${
                    time === s.time
                      ? "border-volt bg-volt text-volt-ink"
                      : s.available
                      ? "border-line bg-ink-card hover:border-line-strong"
                      : "border-line opacity-30 line-through cursor-not-allowed"
                  }`}
                >
                  {s.time}
                </button>
              ))}
            </div>
          )}
          {date && !slotsLoading && slots && slots.every((s) => !s.available) && (
            <p className="text-smoke text-sm mt-3">Šią dieną laisvų laikų nėra. Pasirink kitą dieną.</p>
          )}
          {type === "party" && pkg && time && block && (
            <p className="mt-3 text-[12.5px] text-smoke-2">
              Šventė {time}. Ateiti galima 15 min. anksčiau. Salė rezervuojama nuo {block.start} iki {block.end}.{" "}
              Išeiti būtina iki {addMin(block.end, 5)}.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Step 3: Players (+ extras) ---------------- */
function StepPlayers({ type, pkg, players, setPlayers, addons, setAddons, rooms }: {
  type: BookingType; pkg: ReturnType<typeof getPartyPackage>;
  players: number; setPlayers: (n: number) => void;
  addons: string[]; setAddons: (a: string[]) => void; rooms: number;
}) {
  const min = type === "party" ? 1 : BOOKING.minPlayers;
  const max = type === "party" && pkg ? pkg.maxPlayers : BOOKING.maxPlayers;

  return (
    <div>
      <div className="flex flex-col gap-5 max-w-[460px]">
        <div className="flex items-center justify-between rounded-2xl border border-line bg-ink-card px-6 py-5">
          <div>
            <h3 className="font-display uppercase text-lg">{type === "party" ? "Planuojamas žaidėjų skaičius" : "Žaidėjų skaičius"}</h3>
            {(type === "room" || type === "game") && (
              <p className="text-xs text-smoke-2 mt-1">
                {formatEur(rooms)} € grupei ({formatEur(rooms / players)} €/asm.)
              </p>
            )}
            {type === "party" && pkg && (
              <p className="text-xs text-smoke-2 mt-1">Paketas {pkg.name} · iki {pkg.maxPlayers} žaidėjų.</p>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setPlayers(Math.max(min, players - 1))}
              disabled={players <= min}
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-2xl leading-none hover:border-volt disabled:opacity-30 disabled:cursor-not-allowed"
            >−</button>
            <span className="font-display text-3xl w-9 text-center">{players}</span>
            <button
              onClick={() => setPlayers(Math.min(max, players + 1))}
              disabled={players >= max}
              className="grid h-10 w-10 place-items-center rounded-full border border-line-strong text-2xl leading-none hover:border-volt disabled:opacity-30 disabled:cursor-not-allowed"
            >+</button>
          </div>
        </div>

        {type === "room" && ADDONS.length > 0 && (
          <div>
            <h4 className="font-mono text-sm uppercase tracking-wider text-smoke-2 mb-3">Papildomai</h4>
            <div className="flex flex-col gap-2.5">
              {ADDONS.map((a) => {
                const on = addons.includes(a.id);
                return (
                  <button
                    key={a.id}
                    onClick={() => setAddons(on ? addons.filter((x) => x !== a.id) : [...addons, a.id])}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left ${on ? "border-volt bg-volt/10" : "border-line bg-ink-card hover:border-line-strong"}`}
                  >
                    <span className={`grid h-5.5 w-5.5 place-items-center rounded-md border-2 text-volt-ink text-xs font-extrabold ${on ? "bg-volt border-volt" : "border-line-strong"}`}>{on ? "✓" : ""}</span>
                    <span className="flex-1">
                      <b className="text-[15px]">{a.name}</b>
                      <span className="block text-xs text-smoke-2">{a.desc}</span>
                    </span>
                    <span className="font-mono font-semibold">+{a.price} €</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------- Step 4: Contact ---------------- */
function StepContact({ name, setName, phone, setPhone, email, setEmail, note, setNote, touched, setTouched }: {
  name: string; setName: (v: string) => void;
  phone: string; setPhone: (v: string) => void;
  email: string; setEmail: (v: string) => void;
  note: string; setNote: (v: string) => void;
  touched: { name: boolean; phone: boolean; email: boolean };
  setTouched: (t: { name: boolean; phone: boolean; email: boolean }) => void;
}) {
  const nameOk = validName(name), phoneOk = validPhone(phone), emailOk = validEmail(email);
  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 max-w-[560px]">
        <Field label="Vardas" value={name} onChange={setName}
          onBlur={() => name.trim() && setTouched({ ...touched, name: true })}
          error={touched.name && !nameOk ? "Įvesk vardą (bent 3 raidės)" : ""}
          ok={!!name && nameOk} placeholder="Vardenis" />
        <Field label="Telefonas" value={phone} onChange={setPhone}
          onBlur={() => phone.trim() && setTouched({ ...touched, phone: true })}
          error={touched.phone && !phoneOk ? "Netinkamas numeris (pvz. +370 612 34567)" : ""}
          ok={!!phone && phoneOk} placeholder="+370 6XX XXXXX" inputMode="tel" />
        <div className="sm:col-span-2">
          <Field label="El. paštas" value={email} onChange={setEmail}
            onBlur={() => email.trim() && setTouched({ ...touched, email: true })}
            error={touched.email && !emailOk ? "Netinkamas el. pašto formatas" : ""}
            ok={!!email && emailOk} placeholder="tu@pastas.lt" inputMode="email" />
        </div>
        <div className="sm:col-span-2">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-smoke-2 mb-1.5">Pastabos (nebūtina)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3}
            placeholder="Pvz. gimtadienio vaiko amžius, tortas, alergijos…"
            className="w-full rounded-xl border border-line bg-ink-card px-3.5 py-3 text-white focus:outline-none focus:border-volt" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, onBlur, error, ok, placeholder, inputMode }: {
  label: string; value: string; onChange: (v: string) => void; onBlur: () => void;
  error: string; ok: boolean; placeholder: string; inputMode?: "tel" | "email";
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

/* ---------------- Step 5: Payment ---------------- */
type VoucherUI = {
  input: string; setInput: (v: string) => void; applied: string | null;
  checking: boolean; msg: { ok: boolean; text: string } | null;
  apply: () => void; clear: () => void;
};
function StepPayment({ deposit, onlineDue, onSite, voucherDiscount, error, agreed, setAgreed, voucher }: {
  deposit: number; onlineDue: number; onSite: number; voucherDiscount: number;
  error: string | null; agreed: boolean; setAgreed: (v: boolean) => void; voucher: VoucherUI;
}) {
  const reduced = voucherDiscount > 0 && onlineDue < deposit;
  return (
    <div>
      <div className="max-w-[560px]">
        <div className="flex items-center gap-3.5 rounded-xl border border-volt bg-ink-card px-4.5 py-4 mb-5">
          <span className="grid h-5 w-5 place-items-center rounded-full border-2 border-volt"><span className="h-2.5 w-2.5 rounded-full bg-volt" /></span>
          <span>
            <span className="block font-bold text-[15px]">Bankinė nuoroda</span>
            <span className="block text-xs text-smoke-2">Swedbank, SEB, Luminor, Revolut</span>
          </span>
          <span className="ml-auto font-mono text-[11px] text-smoke-2">Paysera</span>
        </div>

        {/* Dovanų kuponas */}
        <div className="mb-6">
          <label className="block font-mono text-[11px] uppercase tracking-wider text-smoke-2 mb-1.5">Dovanų kuponas (nebūtina)</label>
          {voucher.applied ? (
            <div className="flex items-center gap-3 rounded-xl border border-genre-green/55 bg-genre-green/10 px-4 py-3">
              <span className="text-genre-green">✓</span>
              <span className="flex-1 text-sm">
                <b className="font-mono">{voucher.applied}</b>
                <span className="block text-xs text-smoke-2">Kuponas pritaikytas: −{formatEur(voucherDiscount)} €</span>
              </span>
              <button type="button" onClick={voucher.clear} className="text-[12.5px] font-semibold text-smoke hover:text-genre-pink">Pašalinti</button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <input
                  value={voucher.input}
                  onChange={(e) => voucher.setInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); voucher.apply(); } }}
                  placeholder="BALA-XXXX-XXXX"
                  autoComplete="off"
                  className="flex-1 rounded-xl border border-line bg-ink-card px-3.5 py-3 font-mono text-white focus:outline-none focus:border-volt"
                />
                <button
                  type="button"
                  onClick={voucher.apply}
                  disabled={voucher.checking || !voucher.input.trim()}
                  className="rounded-xl border border-line-strong px-4 py-3 text-sm font-bold hover:border-volt hover:text-volt disabled:opacity-40"
                >
                  {voucher.checking ? "…" : "Taikyti"}
                </button>
              </div>
              {voucher.msg && !voucher.msg.ok && (
                <p className="mt-1.5 text-[12.5px] font-semibold text-genre-pink">{voucher.msg.text}</p>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 rounded-xl border border-volt/40 bg-volt/10 px-5 py-4.5">
          <div>
            <h4 className="font-display uppercase text-[15px]">{onlineDue > 0 ? "Mokėti dabar" : "Apmokėta kuponu"}</h4>
            <p className="text-sm text-smoke mt-1">
              {voucherDiscount > 0 && <>Kuponas −{formatEur(voucherDiscount)} € · </>}
              Likutis {formatEur(onSite)} € — vietoje
            </p>
          </div>
          <div className="text-right whitespace-nowrap">
            {reduced && <div className="font-mono text-sm text-smoke-2 line-through">{formatEur(deposit)} €</div>}
            <div className="font-display text-3xl">{formatEur(onlineDue)} €</div>
          </div>
        </div>

        <label className="mt-6 flex cursor-pointer items-start gap-3 text-sm">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 cursor-pointer accent-volt"
          />
          <span className="text-smoke">
            Susipažinau su{" "}
            <a
              href="/taisykles"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-volt underline underline-offset-2 hover:opacity-80"
            >
              BALA VR taisyklėmis
            </a>{" "}
            ir su jomis sutinku.
          </span>
        </label>

        {error && <p className="mt-4 text-sm font-semibold text-genre-pink">{error}</p>}
      </div>
    </div>
  );
}

/* ---------------- Summary ---------------- */
function Summary({ phase, type, pkg, date, time, players, addons, partyExtras, rooms, total, deposit }: {
  phase: Phase; type: BookingType | null; pkg: ReturnType<typeof getPartyPackage>;
  date: string | null; time: string | null; players: number;
  addons: string[]; partyExtras: string[]; rooms: number; total: number; deposit: number;
}) {
  // Kambario kaina rodoma nuo tada, kai pasiekiama žaidėjų (ar vėlesnė) fazė.
  const reachedPlayers = phase === "players" || phase === "contact" || phase === "payment";
  const priceReady = !!type && (type === "room" || type === "game" ? reachedPlayers : !!pkg && !!date);
  const discount = type === "party" && date ? partyDiscount(date) : 0;

  return (
    <aside className="rounded-2xl border border-line bg-ink-card p-5 lg:sticky lg:top-5">
      <h3 className="font-mono text-xs uppercase tracking-wider text-smoke-2 mb-4">Tavo rezervacija</h3>
      <div className="flex items-center gap-3 border-b border-line pb-4 mb-4">
        <div className="grid h-11 w-11 place-items-center rounded-lg bg-gradient-to-br from-neutral-700 to-black text-xl">
          {type === "party" ? "🎂" : type === "game" ? "🎮" : "🥽"}
        </div>
        <div>
          <h4 className="font-display uppercase text-[15px] leading-tight">
            {type === "party" ? (pkg ? `Paketas ${pkg.name}` : "Šventės paketas") : type === "game" ? "Komandiniai VR žaidimai" : "VR pabėgimo kambarys"}
          </h4>
          <span className="font-mono text-xs text-smoke-2">
            {type === "party" ? (pkg ? pkg.durationLabel : "Pasirink paketą") : type === "game" ? "3 žaidimai · ~45 min." : "Scenarijus — vietoje"}
          </span>
        </div>
      </div>
      <SumLine label="Data" value={date ? fmtDateGen(date) : "—"} />
      <SumLine label={type === "party" ? "Pradžia" : "Laikas"} value={time || "—"} />
      {priceReady ? (
        <>
          {(type === "room" || type === "game") && <SumLine label={`Žaidėjai · ${players} asm.`} value={`${formatEur(rooms)} €`} />}
          {type === "party" && pkg && (
            <>
              <SumLine label={`Paketas ${pkg.name}`} value={`${formatEur(pkg.price)} €`} />
              {discount > 0 && <SumLine label="I–IV nuolaida" value={`−${formatEur(discount)} €`} muted />}
              {PARTY_EXTRAS.filter((e) => partyExtras.includes(e.id)).map((e) => (
                <SumLine key={e.id} label={`+ ${e.name}`} value={`${e.price} €`} muted />
              ))}
              <SumLine label="Įskaičiuota" value={`iki ${pkg.maxPlayers} žaidėjų`} muted />
            </>
          )}
          {type === "room" && addons.length > 0 && ADDONS.filter((a) => addons.includes(a.id)).map((a) => (
            <SumLine key={a.id} label={`+ ${a.name}`} value={`${a.price} €`} muted />
          ))}
          <div className="mt-2 flex items-baseline justify-between border-t border-line pt-4">
            <span className="font-display text-lg uppercase">Viso</span>
            <span className="font-display text-3xl tabular-nums">{formatEur(total)} €</span>
          </div>
          <p className="mt-1 text-right font-mono text-xs text-volt">
            Avansas dabar: {formatEur(deposit)} € · likutis {formatEur(total - deposit)} € vietoje
          </p>
        </>
      ) : (
        <p className="pt-1 text-[12.5px] italic text-smoke-2">
          {!type ? "Pasirink, ką rezervuoji." : type === "party" ? "Kaina paaiškės pasirinkus paketą ir datą." : "Kaina paaiškės pasirinkus žaidėjų skaičių."}
        </p>
      )}
    </aside>
  );
}

function SumLine({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="mb-2.5 flex justify-between gap-2.5 text-sm">
      <span className="text-smoke">{label}</span>
      <span className={`text-right font-mono font-semibold tabular-nums ${muted ? "text-smoke" : "text-white"}`}>{value}</span>
    </div>
  );
}

/* ---------------- Shared ---------------- */
function StepHead({ n, last, title }: { n: number; last: number; title: string }) {
  return (
    <div className="flex items-baseline gap-3.5 mb-1">
      <span className="font-mono text-xs text-volt">{String(n).padStart(2, "0")} / {String(last).padStart(2, "0")}</span>
      <h2 className="font-display text-3xl md:text-4xl uppercase">{title}</h2>
    </div>
  );
}

function fmtDateGen(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]}, ${WD[d.getDay()]}`;
}

/** Prideda n minučių prie "HH:MM" laiko. Pvz. addMin("20:30", 5) -> "20:35". */
function addMin(hhmm: string, n: number): string {
  const [h, m] = hhmm.split(":").map(Number);
  const t = h * 60 + m + n;
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}
