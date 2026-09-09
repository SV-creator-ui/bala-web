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
  if (b.type === "game") return "VR veiksmo žaidimai";
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

  async function resendBookingEmail(b: Booking) {
    const to = window.prompt(
      `Įveskite el. pašto adresą, į kurį siųsti patvirtinimą${b.type === "party" ? " ir gimtadienio kvietimus" : ""}.\n\nOriginalus (DB įraše išliks): ${b.customer_email}`,
      b.customer_email,
    );
    if (!to) return;
    const trimmed = to.trim();
    if (!trimmed) return;
    setBusy(b.id);
    const res = await fetch(`/api/admin/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend", email: trimmed === b.customer_email ? undefined : trimmed }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) window.alert(d.error || "Nepavyko išsiųsti");
    else window.alert(`Išsiųsta: ${trimmed}`);
    setBusy(null);
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
                      {b.status === "paid" && (
                        <ActionBtn onClick={() => resendBookingEmail(b)} disabled={busy === b.id} kind="ghost">Siųsti kitu adresu</ActionBtn>
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

      {/* Dovanų kuponai */}
      <div className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-3">Dovanų kuponai</h2>
        <p className="text-smoke text-sm mb-4">Parduoti dovanų kuponai. „Panaudota" — nurašo rankiniu būdu; „Siųsti PDF" — persiunčia kuponą pirkėjui.</p>
        <VoucherManager demo={demo} />
      </div>

      {/* Blackouts */}
      <div className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-3">Užblokuoti laikai</h2>
        <p className="text-smoke text-sm mb-4">Užblokuoti seansai nerodomi klientams (remontas, privatūs renginiai).</p>
        <BlackoutManager blackouts={blackouts} onChange={load} />
      </div>

      {/* Promo kodai */}
      <div className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-3">Promo kodai</h2>
        <p className="text-smoke text-sm mb-4">
          Lojalumo (<b>SUGRIZK</b>) ir gimtadienių padėkos (<b>ACIU</b>) kodai generuojami automatiškai (kasryt ~10:00).
          Rankiniu būdu gali kurti kodus akcijoms — pvz. studentams ar Black Friday.
        </p>
        <PromoCodeManager demo={demo} />
      </div>

      {/* Priminimo laiškas */}
      <div className="mt-10">
        <h2 className="font-display text-2xl uppercase mb-3">Priminimo laiškas</h2>
        <p className="text-smoke text-sm mb-4">
          Automatiškai siunčiamas <b>dieną prieš vizitą</b> (kasryt ~10:00) apmokėtoms rezervacijoms.
          Redaguok tekstą ir antraštę žemiau. Palaikomi placeholder&apos;iai — jie pakeičiami tikrais rezervacijos duomenimis.
        </p>
        <ReminderTemplateEditor demo={demo} />
      </div>
    </div>
  );
}

/* ---------------- Dovanų kuponai ---------------- */
type Voucher = {
  id: string;
  code: string | null;
  amount_eur: number;
  status: "pending" | "active" | "redeemed" | "cancelled" | "expired";
  buyer_name: string;
  buyer_email: string;
  recipient_name: string | null;
  valid_until: string | null;
  merchant_reference: string;
  redeemed_booking_ref: string | null;
  created_at: string;
};
const V_STATUS_LABEL: Record<Voucher["status"], string> = {
  active: "Aktyvus", redeemed: "Panaudotas", pending: "Laukiama", cancelled: "Atšauktas", expired: "Pasibaigęs",
};
const V_STATUS_CLS: Record<Voucher["status"], string> = {
  active: "bg-genre-green/15 text-genre-green border-genre-green/40",
  redeemed: "bg-white/10 text-smoke-2 border-line",
  pending: "bg-volt/15 text-volt border-volt/40",
  cancelled: "bg-genre-pink/15 text-genre-pink border-genre-pink/40",
  expired: "bg-white/10 text-smoke-2 border-line",
};

function VoucherManager({ demo }: { demo: boolean }) {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const d = await fetch(`/api/admin/vouchers?${params}`).then((r) => r.json()).catch(() => ({ vouchers: [] }));
    setVouchers(d.vouchers ?? []);
    setLoading(false);
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function act(id: string, action: string, email?: string) {
    setBusy(id);
    setNote(null);
    const res = await fetch(`/api/admin/vouchers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, email }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko");
    else if (action === "resend") setNote(email ? `PDF išsiųstas: ${email}` : "PDF išsiųstas pirkėjui.");
    await load();
    setBusy(null);
  }

  function askAndResend(v: Voucher) {
    const to = window.prompt(
      `Įveskite el. pašto adresą, į kurį siųsti kupono PDF.\n\nOriginalus (klaidingas ar teisingas — DB įraše išliks): ${v.buyer_email}`,
      v.buyer_email,
    );
    if (!to) return;
    const trimmed = to.trim();
    if (!trimmed || trimmed === v.buyer_email) {
      // tuščias arba nepakeistas — siunčiam į originalų
      act(v.id, "resend");
      return;
    }
    act(v.id, "resend", trimmed);
  }

  if (demo) {
    return <p className="rounded-xl border border-line bg-ink-card px-4 py-3 text-sm text-smoke-2">Kuponai matomi tik su sukonfigūruota Supabase (ne DEMO režime).</p>;
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Filter label="Būsena">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-lg border border-line bg-ink-card px-3 py-2 text-white [color-scheme:dark]">
            <option value="all">Visi</option>
            <option value="active">Aktyvūs</option>
            <option value="redeemed">Panaudoti</option>
            <option value="pending">Laukiantys</option>
            <option value="cancelled">Atšaukti</option>
          </select>
        </Filter>
        <button onClick={load} className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold hover:border-volt hover:text-volt">Atnaujinti</button>
        {note && <span className="text-sm text-smoke">{note}</span>}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-ink-card text-left font-mono text-[11px] uppercase tracking-wider text-smoke-2">
              <th className="px-4 py-3">Kodas</th>
              <th className="px-4 py-3">Vertė</th>
              <th className="px-4 py-3">Pirkėjas</th>
              <th className="px-4 py-3">Galioja iki</th>
              <th className="px-4 py-3">Būsena</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-smoke-2">Kraunama…</td></tr>
            ) : vouchers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-smoke-2">Kuponų nėra.</td></tr>
            ) : (
              vouchers.map((v) => (
                <tr key={v.id} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-mono whitespace-nowrap">
                    {v.code ?? "—"}
                    {v.redeemed_booking_ref && <div className="text-[11px] text-smoke-2">→ {v.redeemed_booking_ref}</div>}
                  </td>
                  <td className="px-4 py-3 font-mono whitespace-nowrap">{formatEur(Number(v.amount_eur))} €</td>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{v.buyer_name}</div>
                    <div className="text-smoke-2 text-[13px]">{v.buyer_email}</div>
                    {v.recipient_name && <div className="text-[12.5px] italic text-smoke-2">Kam: {v.recipient_name}</div>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-mono">{v.valid_until ? fmtDate(v.valid_until) : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${V_STATUS_CLS[v.status]}`}>{V_STATUS_LABEL[v.status]}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {v.status === "active" && (
                        <>
                          <ActionBtn onClick={() => act(v.id, "redeem")} disabled={busy === v.id} kind="ghost">Panaudota</ActionBtn>
                          <ActionBtn onClick={() => act(v.id, "resend")} disabled={busy === v.id} kind="ghost">Siųsti PDF</ActionBtn>
                          <ActionBtn onClick={() => askAndResend(v)} disabled={busy === v.id} kind="ghost">Siųsti kitu adresu</ActionBtn>
                          <ActionBtn onClick={() => act(v.id, "cancel")} disabled={busy === v.id} kind="danger">Atšaukti</ActionBtn>
                        </>
                      )}
                      {(v.status === "redeemed" || v.status === "cancelled" || v.status === "expired") && (
                        <ActionBtn onClick={() => act(v.id, "reactivate")} disabled={busy === v.id} kind="ok">Atkurti</ActionBtn>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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

/* ---------------- Promo kodų valdymas ---------------- */
type PromoCode = {
  code: string;
  kind: "loyalty" | "party_thanks" | "manual";
  discount_type: "percent" | "fixed";
  discount_value: number;
  assigned_email: string; // tuščias = masinis kodas
  applies_to: ("room" | "game" | "party")[];
  valid_from: string;
  valid_until: string;
  issued_at: string;
  used_at: string | null;
  used_booking_ref: string | null;
  cancelled: boolean;
  min_visits_required: number;
  max_uses: number; // 0 = neribotai
  used_count: number;
};

const PROMO_KIND_LABEL: Record<PromoCode["kind"], string> = {
  loyalty: "Lojalumas",
  party_thanks: "Padėka po šventės",
  manual: "Rankinis",
};
const PROMO_KIND_CLS: Record<PromoCode["kind"], string> = {
  loyalty: "border-volt/40 bg-volt/10 text-volt",
  party_thanks: "border-genre-pink/40 bg-genre-pink/10 text-genre-pink",
  manual: "border-line-strong text-smoke",
};

function promoStatus(p: PromoCode): { label: string; cls: string } {
  if (p.cancelled) return { label: "Atšauktas", cls: "bg-white/10 text-smoke-2 border-line" };
  const maxUses = Number(p.max_uses ?? 1);
  const usedCount = Number(p.used_count ?? (p.used_at ? 1 : 0));
  if (maxUses > 0 && usedCount >= maxUses) return { label: "Išnaudotas", cls: "bg-white/10 text-smoke-2 border-line" };
  const today = new Date().toISOString().slice(0, 10);
  if (today > p.valid_until) return { label: "Pasibaigęs", cls: "bg-white/10 text-smoke-2 border-line" };
  return { label: "Aktyvus", cls: "bg-genre-green/15 text-genre-green border-genre-green/40" };
}
function promoIsAvailable(p: PromoCode, today: string): boolean {
  if (p.cancelled) return false;
  const maxUses = Number(p.max_uses ?? 1);
  const usedCount = Number(p.used_count ?? (p.used_at ? 1 : 0));
  if (maxUses > 0 && usedCount >= maxUses) return false;
  if (today > p.valid_until) return false;
  return true;
}

function PromoCodeManager({ demo }: { demo: boolean }) {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "used" | "expired">("all");
  const [note, setNote] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Rankinio (masinio) kūrimo forma
  const [cValue, setCValue] = useState("20");
  const [cType, setCType] = useState<"percent" | "fixed">("percent");
  const [cApplies, setCApplies] = useState<Record<string, boolean>>({ room: true, game: true, party: false });
  const [cDays, setCDays] = useState("14");
  const [cCustom, setCCustom] = useState("");
  const [cMaxUses, setCMaxUses] = useState("0"); // 0 = neribotai

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/promo-codes").then((r) => r.json());
      setCodes(d?.codes ?? []);
    } catch {
      setCodes([]);
    }
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(code: string, action: string, extra: Record<string, unknown> = {}) {
    setBusy(code);
    setNote(null);
    const res = await fetch("/api/admin/promo-codes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, action, ...extra }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko");
    await load();
    setBusy(null);
  }

  async function create() {
    setBusy("__create");
    setNote(null);
    const applies = Object.entries(cApplies).filter(([, v]) => v).map(([k]) => k);
    const res = await fetch("/api/admin/promo-codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customCode: cCustom.trim() || undefined,
        discountType: cType,
        discountValue: Number(cValue),
        appliesTo: applies,
        validDays: Number(cDays),
        maxUses: Number(cMaxUses) || 0,
      }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko sukurti");
    else {
      setNote(`Sukurta: ${d.code?.code}`);
      setCCustom("");
    }
    await load();
    setBusy(null);
  }

  const today = new Date().toISOString().slice(0, 10);
  const stats = useMemo(() => {
    const totalRedemptions = codes.reduce((s, c) => s + Number(c.used_count ?? (c.used_at ? 1 : 0)), 0);
    return {
      active: codes.filter((c) => promoIsAvailable(c, today)).length,
      redemptions: totalRedemptions,
      expired: codes.filter((c) => !c.cancelled && today > c.valid_until).length,
      cancelled: codes.filter((c) => c.cancelled).length,
    };
  }, [codes, today]);

  const filtered = useMemo(() => {
    if (filter === "active") return codes.filter((c) => promoIsAvailable(c, today));
    if (filter === "used") return codes.filter((c) => Number(c.used_count ?? (c.used_at ? 1 : 0)) > 0);
    if (filter === "expired") return codes.filter((c) => c.cancelled || today > c.valid_until);
    return codes;
  }, [codes, filter, today]);

  if (demo) {
    return <p className="rounded-xl border border-line bg-ink-card px-4 py-3 text-sm text-smoke-2">Promo kodai saugomi DB — matomi tik su sukonfigūruota Supabase (ne DEMO režime).</p>;
  }

  return (
    <div className="space-y-5">
      {/* Statistika */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Aktyvūs" value={String(stats.active)} accent="green" />
        <Stat label="Panaudojimų iš viso" value={String(stats.redemptions)} />
        <Stat label="Pasibaigę" value={String(stats.expired)} />
        <Stat label="Atšaukti" value={String(stats.cancelled)} />
      </div>

      {/* Filtras + naujo kūrimas */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {(["all","active","used","expired"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full border px-3.5 py-1 text-xs font-semibold ${
                filter === f ? "border-volt bg-volt/10 text-volt" : "border-line-strong text-smoke hover:text-white"
              }`}
            >
              {f === "all" ? "Visi" : f === "active" ? "Aktyvūs" : f === "used" ? "Panaudoti" : "Pasibaigę"}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={load} className="rounded-lg border border-line-strong px-3 py-1.5 text-xs font-semibold hover:border-volt hover:text-volt">Atnaujinti</button>
          <button
            onClick={() => setShowCreate((v) => !v)}
            className="rounded-lg border border-volt/50 bg-volt/10 px-3 py-1.5 text-xs font-semibold text-volt hover:bg-volt/20"
          >
            {showCreate ? "Uždaryti" : "+ Naujas kodas"}
          </button>
        </div>
        {note && <span className="text-sm text-smoke">{note}</span>}
      </div>

      {/* Rankinio MASINIO kodo kūrimo forma */}
      {showCreate && (
        <div className="rounded-2xl border border-volt/30 bg-volt/5 p-5 space-y-3">
          <h3 className="font-mono text-xs uppercase tracking-wider text-volt mb-1">Naujas masinis kodas</h3>
          <p className="text-[12px] text-smoke-2 mb-2">
            Kodą galės įvesti bet kuris klientas (be el. pašto apribojimo). Skirta akcijoms — Black Friday, Kalėdos, sezoninės nuolaidos.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-smoke-2 mb-1">Kodas (paliksi tuščią → sugeneruos)</div>
              <input value={cCustom} onChange={(e) => setCCustom(e.target.value.toUpperCase())}
                placeholder="BLACKFRIDAY2026"
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white font-mono text-sm" />
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-smoke-2 mb-1">Nuolaida</div>
              <div className="flex gap-2">
                <input type="number" value={cValue} onChange={(e) => setCValue(e.target.value)} min={1} max={100}
                  className="flex-1 rounded-lg border border-line bg-ink px-3 py-2 text-white text-sm" />
                <select value={cType} onChange={(e) => setCType(e.target.value as "percent" | "fixed")}
                  className="rounded-lg border border-line bg-ink px-3 py-2 text-white text-sm">
                  <option value="percent">%</option>
                  <option value="fixed">€</option>
                </select>
              </div>
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-smoke-2 mb-1">Galiojimas (dienomis)</div>
              <input type="number" value={cDays} onChange={(e) => setCDays(e.target.value)} min={1} max={365}
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white text-sm" />
            </label>
            <label className="block">
              <div className="text-[11px] uppercase tracking-wider text-smoke-2 mb-1">Panaudojimų limitas (0 = neribotai)</div>
              <input type="number" value={cMaxUses} onChange={(e) => setCMaxUses(e.target.value)} min={0} max={10000}
                placeholder="0"
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white text-sm" />
            </label>
          </div>
          <div>
            <div className="text-[11px] uppercase tracking-wider text-smoke-2 mb-1.5">Tinka paslaugoms</div>
            <div className="flex flex-wrap gap-4 text-sm">
              {[
                { k: "room", label: "Pabėgimo kambariai" },
                { k: "game", label: "VR veiksmo žaidimai" },
                { k: "party", label: "Gimtadieniai" },
              ].map((o) => (
                <label key={o.k} className="flex items-center gap-2">
                  <input type="checkbox" checked={cApplies[o.k] ?? false}
                    onChange={(e) => setCApplies({ ...cApplies, [o.k]: e.target.checked })}
                    className="h-4 w-4" />
                  {o.label}
                </label>
              ))}
            </div>
          </div>
          <button onClick={create} disabled={busy === "__create"}
            className="rounded-lg bg-volt px-4 py-2.5 font-bold text-volt-ink transition hover:-translate-y-0.5 disabled:opacity-40">
            {busy === "__create" ? "Kuriama…" : "Sukurti kodą"}
          </button>
        </div>
      )}

      {/* Sąrašas */}
      <div className="overflow-x-auto rounded-2xl border border-line">
        <table className="w-full min-w-[900px] text-sm">
          <thead>
            <tr className="bg-ink-card text-left font-mono text-[11px] uppercase tracking-wider text-smoke-2">
              <th className="px-4 py-3">Kodas</th>
              <th className="px-4 py-3">Tipas</th>
              <th className="px-4 py-3">Nuolaida</th>
              <th className="px-4 py-3">Kam / Panaudojimai</th>
              <th className="px-4 py-3">Galioja iki</th>
              <th className="px-4 py-3">Būsena</th>
              <th className="px-4 py-3 text-right">Veiksmai</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-smoke-2">Kraunama…</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-smoke-2">Kodų nėra.</td></tr>
            ) : (
              filtered.map((c) => {
                const st = promoStatus(c);
                const disc = c.discount_type === "percent" ? `${c.discount_value}%` : `${formatEur(c.discount_value)} €`;
                const maxUses = Number(c.max_uses ?? 1);
                const usedCount = Number(c.used_count ?? (c.used_at ? 1 : 0));
                const isMass = !c.assigned_email;
                const usageStr = maxUses === 0 ? `${usedCount} panaud.` : `${usedCount} / ${maxUses}`;
                return (
                  <tr key={c.code} className="border-t border-line align-top">
                    <td className="px-4 py-3 font-mono whitespace-nowrap">
                      {c.code}
                      {c.used_booking_ref && usedCount === 1 && <div className="text-[11px] text-smoke-2">→ {c.used_booking_ref}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${PROMO_KIND_CLS[c.kind]}`}>
                        {PROMO_KIND_LABEL[c.kind]}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {disc}
                      <div className="text-[11px] text-smoke-2">{c.applies_to.map(shortAppliesLabel).join(" · ")}</div>
                      {c.min_visits_required > 0 && (
                        <div className="text-[11px] text-smoke-2">≥{c.min_visits_required + 1}-am vizitui</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13px]">
                      {isMass ? (
                        <>
                          <span className="inline-block rounded-full border border-line-strong px-2 py-0.5 text-[10.5px] font-bold text-smoke">MASINIS</span>
                          <div className="mt-0.5 font-mono text-smoke-2 text-[12.5px]">{usageStr}</div>
                        </>
                      ) : (
                        <>
                          <div className="text-smoke">{c.assigned_email}</div>
                          <div className="mt-0.5 font-mono text-smoke-2 text-[12.5px]">{usageStr}</div>
                        </>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono">{c.valid_until}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded-full border px-2.5 py-1 text-[11px] font-bold ${st.cls}`}>{st.label}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        {promoIsAvailable(c, today) && (
                          <>
                            <ActionBtn onClick={() => act(c.code, "extend", { extendDays: 30 })} disabled={busy === c.code} kind="ghost">+30d</ActionBtn>
                            <ActionBtn onClick={() => act(c.code, "cancel")} disabled={busy === c.code} kind="danger">Atšaukti</ActionBtn>
                          </>
                        )}
                        {c.cancelled && (
                          <ActionBtn onClick={() => act(c.code, "reactivate")} disabled={busy === c.code} kind="ok">Atkurti</ActionBtn>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function shortAppliesLabel(t: string): string {
  if (t === "room") return "kamb.";
  if (t === "game") return "žaid.";
  if (t === "party") return "gimt.";
  return t;
}

/* ---------------- Priminimo laiškų redaktorius (po vieną kiekvienai paslaugai) ---------------- */
type ReminderTemplate = { enabled: boolean; subject: string; body_html: string };
type BookingType = "room" | "game" | "party";
const BOOKING_TYPE_TABS: { key: BookingType; label: string; hint: string }[] = [
  { key: "room",  label: "Kambariai", hint: "Pabėgimo kambariai — scenarijaus pasirinkimas vietoje" },
  { key: "game",  label: "Žaidimai",  hint: "VR veiksmo žaidimai — aktyvūs, patogi apranga" },
  { key: "party", label: "Gimtadieniai", hint: "Gimtadienio šventės — įtrauktas vėlavimo mokesčio įspėjimas" },
];

const PLACEHOLDER_HELP: { key: string; label: string }[] = [
  { key: "name", label: "Kliento vardas" },
  { key: "date", label: "Data (pvz. 12 rugsėjo 2026)" },
  { key: "time", label: "Laikas (pvz. 16:30)" },
  { key: "players", label: "Žaidėjų skaičius" },
  { key: "service", label: "Paslauga (kambarys / žaidimai / paketas)" },
  { key: "reference", label: "Rezervacijos numeris" },
  { key: "total", label: "Bendra suma (€)" },
  { key: "deposit", label: "Sumokėtas avansas (€)" },
  { key: "on_site", label: "Likutis vietoje (€)" },
];

function ReminderTemplateEditor({ demo }: { demo: boolean }) {
  const [templates, setTemplates] = useState<Record<BookingType, ReminderTemplate> | null>(null);
  const [initial, setInitial] = useState<Record<BookingType, ReminderTemplate> | null>(null);
  const [activeType, setActiveType] = useState<BookingType>("room");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<null | "save" | "test" | "run">(null);
  const [note, setNote] = useState<string | null>(null);
  const [testTo, setTestTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const d = await fetch("/api/admin/reminder-template").then((r) => r.json());
      if (d?.templates) {
        setTemplates(d.templates);
        setInitial(d.templates);
      }
    } catch {
      /* ignore */
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function updateActive(patch: Partial<ReminderTemplate>) {
    if (!templates) return;
    setTemplates({ ...templates, [activeType]: { ...templates[activeType], ...patch } });
  }

  async function save() {
    if (!templates) return;
    setBusy("save"); setNote(null);
    const res = await fetch("/api/admin/reminder-template", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: activeType, ...templates[activeType] }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko išsaugoti");
    else { setNote(`Išsaugota (${BOOKING_TYPE_TABS.find((t) => t.key === activeType)?.label}).`); setInitial(templates); }
    setBusy(null);
  }

  async function test() {
    if (!templates) return;
    setBusy("test"); setNote(null);
    const res = await fetch("/api/admin/reminder-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "test", type: activeType, to: testTo || undefined, template: templates[activeType] }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko išsiųsti bandymo");
    else setNote(`Bandymo laiškas (${activeType}) išsiųstas: ${d.sent_to}`);
    setBusy(null);
  }

  async function runNow() {
    if (!confirm("Paleisti priminimų siuntimą DABAR (rytojaus paid rezervacijoms, kurios dar negavo priminimo)?")) return;
    setBusy("run"); setNote(null);
    const res = await fetch("/api/admin/reminder-template", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run_now" }),
    });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) setNote(d.error || "Nepavyko");
    else setNote(`Rasta ${d.candidates}, išsiųsta ${d.sent}, klaidų ${d.failed}.${d.skipped_reason ? ` (${d.skipped_reason})` : ""}`);
    setBusy(null);
  }

  if (demo) {
    return <p className="rounded-xl border border-line bg-ink-card px-4 py-3 text-sm text-smoke-2">Priminimo šablonai saugomi DB — matomi tik su sukonfigūruota Supabase (ne DEMO režime).</p>;
  }
  if (loading || !templates || !initial) {
    return <p className="rounded-xl border border-line bg-ink-card px-4 py-3 text-sm text-smoke-2">Kraunama…</p>;
  }

  const tmpl = templates[activeType];
  const initTmpl = initial[activeType];
  const dirty =
    tmpl.enabled !== initTmpl.enabled ||
    tmpl.subject !== initTmpl.subject ||
    tmpl.body_html !== initTmpl.body_html;
  const activeHint = BOOKING_TYPE_TABS.find((t) => t.key === activeType)?.hint;

  return (
    <div>
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {BOOKING_TYPE_TABS.map((t) => {
          const isActive = t.key === activeType;
          const isDirty = initial && (
            templates[t.key].enabled !== initial[t.key].enabled ||
            templates[t.key].subject !== initial[t.key].subject ||
            templates[t.key].body_html !== initial[t.key].body_html
          );
          return (
            <button
              key={t.key}
              onClick={() => setActiveType(t.key)}
              className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                isActive
                  ? "border-volt bg-volt/10 text-volt"
                  : "border-line-strong text-smoke hover:text-white"
              }`}
            >
              {t.label}
              {isDirty && <span className="ml-1.5 text-volt">•</span>}
              {!templates[t.key].enabled && <span className="ml-1.5 text-smoke-2 text-[11px]">(išj.)</span>}
            </button>
          );
        })}
      </div>
      {activeHint && <p className="text-xs text-smoke-2 mb-4 -mt-2">{activeHint}</p>}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] items-start">
        <div className="rounded-2xl border border-line bg-ink-card p-5 space-y-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={tmpl.enabled}
              onChange={(e) => updateActive({ enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <span>Šio tipo priminimai <b>{tmpl.enabled ? "įjungti" : "išjungti"}</b> (siunčiami kasryt ~10:00)</span>
          </label>

          <label className="block">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2 mb-1">Antraštė (subject)</div>
            <input
              value={tmpl.subject}
              onChange={(e) => updateActive({ subject: e.target.value })}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white"
            />
          </label>

          <label className="block">
            <div className="font-mono text-[10.5px] uppercase tracking-wider text-smoke-2 mb-1">Laiško turinys (HTML)</div>
            <textarea
              value={tmpl.body_html}
              onChange={(e) => updateActive({ body_html: e.target.value })}
              rows={14}
              className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white font-mono text-[12.5px] leading-relaxed"
              spellCheck={false}
            />
            <div className="text-[11px] text-smoke-2 mt-1">
              Galima naudoti HTML žymes (&lt;p&gt;, &lt;b&gt;, &lt;ul&gt;, &lt;a href&gt;…). Aplink dedami antraštė ir kontaktai automatiškai.
            </div>
          </label>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={save}
              disabled={busy !== null || !dirty}
              className="rounded-lg bg-volt px-4 py-2.5 font-bold text-volt-ink transition hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
            >
              {busy === "save" ? "Saugoma…" : dirty ? "Išsaugoti šį šabloną" : "Išsaugota"}
            </button>
            <button
              onClick={() => setTemplates({ ...templates, [activeType]: initTmpl })}
              disabled={!dirty || busy !== null}
              className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-smoke hover:text-white disabled:opacity-40"
            >
              Atšaukti pakeitimus
            </button>
            {note && <span className="text-sm text-smoke">{note}</span>}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-line bg-ink-card p-5">
            <h3 className="font-mono text-xs uppercase tracking-wider text-smoke-2 mb-3">Placeholder&apos;iai</h3>
            <ul className="space-y-1.5 text-[12.5px]">
              {PLACEHOLDER_HELP.map((p) => (
                <li key={p.key} className="flex justify-between gap-3 border-b border-line/50 pb-1.5 last:border-b-0">
                  <code className="text-volt">{`{{${p.key}}}`}</code>
                  <span className="text-smoke-2 text-right">{p.label}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-ink-card p-5 space-y-3">
            <h3 className="font-mono text-xs uppercase tracking-wider text-smoke-2">Bandymas / rankinis paleidimas</h3>
            <div className="flex flex-col gap-2">
              <input
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="Bandymo el. paštas (jei tuščia — admino)"
                className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-white text-sm"
              />
              <button
                onClick={test}
                disabled={busy !== null}
                className="rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold hover:border-volt hover:text-volt disabled:opacity-40"
              >
                {busy === "test" ? "Siunčiama…" : `Siųsti bandymo laišką (${BOOKING_TYPE_TABS.find((t) => t.key === activeType)?.label})`}
              </button>
            </div>
            <div className="border-t border-line/50 pt-3">
              <button
                onClick={runNow}
                disabled={busy !== null}
                className="w-full rounded-lg border border-genre-pink/50 px-4 py-2 text-sm font-semibold text-genre-pink hover:bg-genre-pink/10 disabled:opacity-40"
              >
                {busy === "run" ? "Paleidžiama…" : "Paleisti priminimus DABAR (visi tipai)"}
              </button>
              <p className="mt-2 text-[11px] text-smoke-2">
                Sesantis: išsiunčia rytojaus <b>paid</b> rezervacijoms, kurios dar negavo priminimo. Pakartoti tas pačias neišsiųs. Kiekvienai rezervacijai naudojamas atitinkamo tipo šablonas.
              </p>
            </div>
          </div>
        </div>
      </div>
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
