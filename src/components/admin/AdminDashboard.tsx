"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { generateSlots } from "@/lib/booking/config";
import { formatEur } from "@/lib/booking/pricing";
import { getPartyPackage } from "@/lib/booking/packages";

type Booking = {
  id: string;
  type: "room" | "party" | "game";
  package_id: string | null;
  date: string;
  time: string;
  block_start: string | null;
  block_end: string | null;
  players: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  note: string | null;
  total_eur: number;
  deposit_eur: number;
  status: "pending" | "paid" | "cancelled" | "expired";
  merchant_reference: string;
};

function serviceLabel(b: Booking): string {
  if (b.type === "party") {
    const pkg = getPartyPackage(b.package_id ?? "");
    return pkg ? `Paketas ${pkg.name}` : "Šventės paketas";
  }
  if (b.type === "game") return "Komandiniai VR žaidimai";
  return "Pabėgimo kambarys";
}
type Blackout = { id: string; date: string; time: string | null; reason: string | null };

const SLOTS = generateSlots();
const STATUS_LABEL: Record<Booking["status"], string> = {
  paid: "Apmokėta", pending: "Laukiama", cancelled: "Atšaukta", expired: "Pasibaigusi",
};
const STATUS_CLS: Record<Booking["status"], string> = {
  paid: "bg-genre-green/15 text-genre-green border-genre-green/40",
  pending: "bg-volt/15 text-volt border-volt/40",
  cancelled: "bg-genre-pink/15 text-genre-pink border-genre-pink/40",
  expired: "bg-white/10 text-smoke-2 border-line",
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const MONTHS = ["sau","vas","kov","bal","geg","bir","lie","rgp","rgs","spa","lap","grd"];
function fmtDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

export default function AdminDashboard({ demo }: { demo: boolean }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(todayISO());
  const [to, setTo] = useState("");
  const [status, setStatus] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (status) params.set("status", status);
    const [b, bo] = await Promise.all([
      fetch(`/api/admin/bookings?${params}`).then((r) => r.json()),
      fetch(`/api/admin/blackouts`).then((r) => r.json()),
    ]);
    setBookings(b.bookings ?? []);
    setBlackouts(bo.blackouts ?? []);
    setLoading(false);
  }, [from, to, status]);

  useEffect(() => { load(); }, [load]);

  async function setBookingStatus(id: string, newStatus: Booking["status"]) {
    setBusy(id);
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await load();
    setBusy(null);
  }

  async function rescheduleBooking(id: string, date: string, time: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch(`/api/admin/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time }),
    });
    const d = await res.json().catch(() => ({}));
    return { ok: res.ok, error: d.error };
  }

  async function logout() {
    await fetch("/api/admin/session", { method: "DELETE" });
    window.location.reload();
  }

  const stats = useMemo(() => {
    const t = todayISO();
    return {
      today: bookings.filter((b) => b.date === t && b.status !== "cancelled").length,
      pending: bookings.filter((b) => b.status === "pending").length,
      paid: bookings.filter((b) => b.status === "paid").length,
      deposits: bookings.filter((b) => b.status === "paid").reduce((s, b) => s + Number(b.deposit_eur), 0),
    };
  }, [bookings]);

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-2xl bg-volt text-volt-ink px-3 py-1 rounded-lg">BALA</span>
          <span className="font-mono text-xs uppercase tracking-[0.18em] text-smoke-2">Rezervacijų skydelis</span>
        </div>
        <button onClick={logout} className="rounded-full border border-line-strong px-4 py-2 text-sm font-semibold hover:border-volt hover:text-volt">
          Atsijungti
        </button>
      </div>

      {demo && (
        <div className="mb-6 rounded-xl border border-volt/40 bg-volt/10 px-4 py-3 text-sm text-smoke">
          <b className="text-volt">DEMO režimas</b> — rodomi pavyzdiniai duomenys. Pakeitimai negrįžtamai neišsaugomi. Sukonfigūruokite Supabase (žr. REZERVACIJA_SETUP.md), kad matytumėte tikras rezervacijas.
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Šiandien" value={String(stats.today)} />
        <Stat label="Laukiama apmokėjimo" value={String(stats.pending)} accent="volt" />
        <Stat label="Apmokėta" value={String(stats.paid)} accent="green" />
        <Stat label="Surinkti avansai" value={`${formatEur(stats.deposits)} €`} />
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Filter label="Nuo"><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-line bg-ink-card px-3 py-2 text-white [color-scheme:dark]" /></Filter>
        <Filter label="Iki"><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-line bg-ink-card px-3 py-2 text-white [color-scheme:dark]" /></Filter>
        <Filter label="Būsena">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-ink-card px-3 py-2 text-white [color-scheme:dark]">
            <option value="all">Visos</option>
            <option value="paid">Apmokėtos</option>
            <option value="pending">Laukiančios</option>
            <option value="cancelled">Atšauktos</option>
          </select>
        </Filter>
        <button onClick={load} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold hover:border-volt hover:text-volt">Atnaujinti</button>
      </div>

      {/* Bookings table */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-ink-card text-left font-mono text-[11px] uppercase tracking-wider text-smoke-2">
              <th className="px-4 py-3">Data / laikas</th>
              <th className="px-4 py-3">Paslauga</th>
              <th className="px-4 py-3">Klientas</th>
              <th className="px-4 py-3">Žaid.</th>
              <th className="px-4 py-3">Suma / avansas</th>
              <th className="px-4 py-3">Būsena</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-smoke-2">Kraunama…</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-smoke-2">Rezervacijų nėra.</td></tr>
            ) : (
              bookings.map((b) => (
                <Fragment key={b.id}>
                <tr className="border-t border-line align-top">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="font-semibold">{fmtDate(b.date)}</div>
                    <div className="font-mono text-smoke-2">{b.time}</div>
                    {b.block_start && b.block_end && (
                      <div className="font-mono text-[11px] text-smoke-2 mt-0.5">salė {b.block_start}–{b.block_end}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${
                      b.type === "party" ? "border-genre-pink/40 bg-genre-pink/10 text-genre-pink" : "border-line-strong text-smoke"
                    }`}>
                      {serviceLabel(b)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{b.customer_name}</div>
                    <div className="text-smoke-2 text-[13px]">{b.customer_phone}</div>
                    <div className="text-smoke-2 text-[13px]">{b.customer_email}</div>
                    {b.note && <div className="mt-1 text-[12.5px] italic text-smoke-2">„{b.note}"</div>}
                  </td>
                  <td className="px-4 py-3 font-mono">{b.players}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">
                    <div>{formatEur(Number(b.total_eur))} €</div>
                    <div className="text-smoke-2 text-[13px]">av. {formatEur(Number(b.deposit_eur))} €</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${STATUS_CLS[b.status]}`}>
                      {STATUS_LABEL[b.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {b.status === "pending" && (
                        <ActionBtn onClick={() => setBookingStatus(b.id, "paid")} disabled={busy === b.id} kind="ok">Apmokėta</ActionBtn>
                      )}
                      {b.status !== "cancelled" && (
                        <ActionBtn onClick={() => setRescheduleId(rescheduleId === b.id ? null : b.id)} disabled={busy === b.id} kind="ghost">Perkelti</ActionBtn>
                      )}
                      {b.status !== "cancelled" && (
                        <ActionBtn onClick={() => setBookingStatus(b.id, "cancelled")} disabled={busy === b.id} kind="danger">Atšaukti</ActionBtn>
                      )}
                      {b.status === "cancelled" && (
                        <ActionBtn onClick={() => setBookingStatus(b.id, "pending")} disabled={busy === b.id} kind="ghost">Atkurti</ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
                {rescheduleId === b.id && (
                  <tr className="border-t border-line bg-ink-card/50">
                    <td colSpan={7} className="px-4 py-4">
                      <RescheduleForm
                        currentDate={b.date}
                        currentTime={b.time}
                        onDone={() => { setRescheduleId(null); load(); }}
                        onCancel={() => setRescheduleId(null)}
                        onSubmit={(date, time) => rescheduleBooking(b.id, date, time)}
                      />
                    </td>
                  </tr>
                )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Blackouts */}
      <div className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-3">Užblokuoti laikai</h2>
        <p className="text-smoke text-sm mb-4">Užblokuoti seansai nerodomi klientams (remontas, privatūs renginiai).</p>
        <BlackoutManager blackouts={blackouts} onChange={load} />
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: "volt" | "green" }) {
  const color = accent === "volt" ? "text-volt" : accent === "green" ? "text-genre-green" : "text-white";
  return (
    <div className="rounded-2xl border border-line bg-ink-card p-4">
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">{label}</div>
      <div className={`font-display text-3xl mt-1 tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">{label}</span>
      {children}
    </label>
  );
}

function ActionBtn({ children, onClick, disabled, kind }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; kind: "ok" | "danger" | "ghost";
}) {
  const cls = kind === "ok"
    ? "border-genre-green/50 text-genre-green hover:bg-genre-green/10"
    : kind === "danger"
    ? "border-genre-pink/50 text-genre-pink hover:bg-genre-pink/10"
    : "border-line-strong text-smoke hover:text-white";
  return (
    <button onClick={onClick} disabled={disabled} className={`rounded-lg border px-3 py-1.5 text-[12.5px] font-semibold transition disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

function RescheduleForm({ currentDate, currentTime, onSubmit, onDone, onCancel }: {
  currentDate: string; currentTime: string;
  onSubmit: (date: string, time: string) => Promise<{ ok: boolean; error?: string }>;
  onDone: () => void; onCancel: () => void;
}) {
  const [date, setDate] = useState(currentDate);
  const [time, setTime] = useState(currentTime);
  const [slots, setSlots] = useState<{ time: string; available: boolean }[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setSlots(null);
    fetch(`/api/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => { if (!cancelled) setSlots(d.slots ?? []); })
      .catch(() => { if (!cancelled) setSlots([]); });
    return () => { cancelled = true; };
  }, [date]);

  async function save() {
    setBusy(true);
    setError("");
    const r = await onSubmit(date, time);
    if (r.ok) onDone();
    else { setError(r.error || "Nepavyko perkelti"); setBusy(false); }
  }

  // Ar pasirinktas laikas laisvas (arba tas pats, kaip dabartinis)
  const chosen = slots?.find((s) => s.time === time);
  const timeOk = date === currentDate && time === currentTime ? true : chosen?.available ?? false;

  return (
    <div className="flex flex-col gap-3">
      <div className="font-mono text-[11px] uppercase tracking-wider text-smoke-2">
        Perkelti iš: <span className="text-white">{fmtDate(currentDate)} {currentTime}</span>
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">Nauja data</span>
          <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} className="rounded-lg border border-line bg-ink px-3 py-2 text-white [color-scheme:dark]" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2">Naujas laikas</span>
          <select value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-white [color-scheme:dark] min-w-[130px]">
            <option value="">— pasirink —</option>
            {(slots ?? []).map((s) => (
              <option key={s.time} value={s.time} disabled={!s.available && !(date === currentDate && s.time === currentTime)}>
                {s.time}{!s.available && !(date === currentDate && s.time === currentTime) ? " (užimta)" : ""}
              </option>
            ))}
          </select>
        </label>
        <button onClick={save} disabled={busy || !time || !timeOk} className="rounded-lg bg-volt px-4 py-2 font-bold text-volt-ink transition hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0">
          {busy ? "Perkeliama…" : "Patvirtinti perkėlimą"}
        </button>
        <button onClick={onCancel} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-smoke hover:text-white">
          Atšaukti
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-genre-pink">{error}</p>}
    </div>
  );
}

function BlackoutManager({ blackouts, onChange }: { blackouts: Blackout[]; onChange: () => void }) {
  const [date, setDate] = useState(todayISO());
  const [time, setTime] = useState("all");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  async function add() {
    setBusy(true);
    await fetch("/api/admin/blackouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time: time === "all" ? null : time, reason }),
    });
    setReason("");
    await onChange();
    setBusy(false);
  }
  async function remove(id: string) {
    setBusy(true);
    await fetch(`/api/admin/blackouts/${id}`, { method: "DELETE" });
    await onChange();
    setBusy(false);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr] items-start">
      <div className="rounded-2xl border border-line bg-ink-card p-5">
        <h3 className="font-mono text-xs uppercase tracking-wider text-smoke-2 mb-3">Blokuoti naują</h3>
        <div className="flex flex-col gap-3">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-white [color-scheme:dark]" />
          <select value={time} onChange={(e) => setTime(e.target.value)} className="rounded-lg border border-line bg-ink px-3 py-2 text-white [color-scheme:dark]">
            <option value="all">Visa diena</option>
            {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Priežastis (nebūtina)" className="rounded-lg border border-line bg-ink px-3 py-2 text-white" />
          <button onClick={add} disabled={busy} className="rounded-lg bg-volt px-4 py-2.5 font-bold text-volt-ink transition hover:-translate-y-0.5 disabled:opacity-40">
            Blokuoti
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-line overflow-hidden">
        {blackouts.length === 0 ? (
          <p className="px-4 py-8 text-center text-smoke-2 text-sm">Užblokuotų laikų nėra.</p>
        ) : (
          <ul>
            {blackouts.map((bo) => (
              <li key={bo.id} className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 last:border-b-0">
                <div>
                  <span className="font-semibold">{fmtDate(bo.date)}</span>
                  <span className="ml-2 font-mono text-smoke-2">{bo.time ?? "visa diena"}</span>
                  {bo.reason && <span className="ml-2 text-smoke-2 text-[13px]">· {bo.reason}</span>}
                </div>
                <button onClick={() => remove(bo.id)} disabled={busy} className="rounded-lg border border-genre-pink/50 px-3 py-1.5 text-[12.5px] font-semibold text-genre-pink hover:bg-genre-pink/10 disabled:opacity-40">
                  Pašalinti
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
