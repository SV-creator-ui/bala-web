/**
 * Laisvų PRADŽIOS laikų skaičiavimas (serveryje) — bendras grafikas.
 * Kiekviena esama rezervacija (paid arba galiojantis pending) užima intervalą.
 * Naujas pradžios laikas tinka, jei visas jo langas telpa į darbo laiką ir
 * nepersidengia su užimtais intervalais (talpa BOOKING.slotCapacity) bei
 * neužkliudo užblokuotų (blackouts) laikų.
 */
import { getSupabaseAdmin } from "@/lib/supabase/server";
import {
  BOOKING, generateSlotsForDate, dayHours, toMin,
  EARLY_OPEN_MIN, PARTY_BLOCKED_STARTS_EARLY, venueNow, type BookingType,
} from "./config";
import {
  activeInterval, activityEndMin, overlaps, conflictsWithGap,
  type Interval, type TypedInterval,
} from "./window";
import { isClosedHoliday } from "./holidays";

export type SlotStatus = { time: string; available: boolean };

export type AvailabilityQuery = {
  type: BookingType;
  packageId?: string | null;
  addons?: string[];
  /** Rezervacijos id, kurios NEskaičiuoti kaip užimtos (perkeliant ją pačią). */
  excludeId?: string | null;
};

/**
 * GRYNAS (aktyvus) langas + tipas, kurį grafike užima esama rezervacija.
 * Tarpai tarp užsakymų pridedami atskirai (žr. `conflictsWithGap`), todėl čia
 * NENAUDOJAME saugotų block_start/block_end (jie su buferiais — verslo kalendoriui).
 */
function existingActive(b: {
  time: string;
  type?: string | null;
  package_id?: string | null;
  addons?: unknown;
}): TypedInterval {
  const addons = Array.isArray(b.addons) ? (b.addons as unknown[]).map(String) : [];
  const type: BookingType =
    b.type === "party" ? "party" : b.type === "game" ? "game" : "room";
  return { ...activeInterval(type, b.time, b.package_id ?? null, addons), type };
}

export async function getAvailability(date: string, query: AvailabilityQuery): Promise<SlotStatus[]> {
  const slots = generateSlotsForDate(date);

  // Kalėdų dienomis (gruodžio 24–26) patalpa uždaryta — jokių laisvų laikų.
  if (isClosedHoliday(date)) {
    return slots.map((time) => ({ time, available: false }));
  }

  const supabase = getSupabaseAdmin();
  const { openMin, closeEndMin } = dayHours(date);

  // Išankstinio laiko riba: šiandienai neberodome jau prasidėjusių ar per arti
  // esančių laikų (mažiau nei „dabar + bookingLeadMin"). Kitoms dienoms — 0.
  const nowV = venueNow();
  const leadCutoffMin = date === nowV.date ? nowV.min + BOOKING.bookingLeadMin : -1;

  const holdCutoff = new Date(Date.now() - BOOKING.pendingHoldMin * 60_000).toISOString();

  const [{ data: bookings }, { data: blackouts }] = await Promise.all([
    supabase
      .from("bookings")
      .select("id,time,status,created_at,type,package_id,block_start,block_end,addons")
      .eq("date", date)
      .in("status", ["paid", "pending"]),
    supabase.from("blackouts").select("time").eq("date", date),
  ]);

  const wholeDayBlocked = (blackouts || []).some((b) => b.time === null);
  // Kiekvienas užblokuotas laikas — 30 min. langas [t, t+step).
  const blackoutIntervals: Interval[] = (blackouts || [])
    .filter((b) => b.time)
    .map((b) => {
      const s = toMin(b.time as string);
      return { startMin: s, endMin: s + BOOKING.slotStepMin };
    });

  // Galiojantys užimti intervalai (grynas veiklos langas + tipas).
  const busy: TypedInterval[] = [];
  for (const b of bookings || []) {
    if (query.excludeId && b.id === query.excludeId) continue; // ji pati (perkeliama)
    if (b.status === "pending" && b.created_at < holdCutoff) continue; // nustojęs galioti holdas
    busy.push(existingActive(b));
  }

  // Šiandienai visiškai nerodome praėjusių / per arti esančių laikų.
  const visible = leadCutoffMin >= 0 ? slots.filter((t) => toMin(t) >= leadCutoffMin) : slots;

  return visible.map((time) => {
    if (wholeDayBlocked) return { time, available: false };

    // Rytinė apsauga: 10 val. dienomis šventės pradžia negalima 11:30/12:00/12:30.
    if (query.type === "party" && openMin === EARLY_OPEN_MIN && PARTY_BLOCKED_STARTS_EARLY.has(time)) {
      return { time, available: false };
    }

    // Kandidato GRYNAS veiklos langas (be buferių) + tipas.
    const cand: TypedInterval = {
      startMin: toMin(time),
      endMin: activityEndMin(query.type, time, query.packageId ?? null, query.addons ?? []),
      type: query.type,
    };

    // 1) Ar telpa į darbo laiką? Pradžia ne anksčiau nei atidarymas, o AKTYVI
    //    veikla turi baigtis iki uždarymo. Susitvarkymo laikas (po-buferis) gali
    //    tęstis po uždarymo — todėl į patikrą jo neįtraukiame. Taip I–IV
    //    (uždaro 20:30) galima pradėti 2,5 val. paketą 18:00.
    if (cand.startMin < openMin || cand.endMin > closeEndMin) return { time, available: false };

    // 2) Ar neužkliudo užblokuotų laikų? (užblokuotas = grynas 30 min. langas)
    if (blackoutIntervals.some((bo) => overlaps(cand, bo))) return { time, available: false };

    // 3) Ar telpa į talpą? Konfliktas įskaito būtiną TARPĄ tarp užsakymų, kuris
    //    priklauso nuo gretimų tipų (žr. requiredGapMin): →šventė 30 min,
    //    šventė→kambarys/žaidimai 15 min, kambarys/žaidimai tarpusavyje 0.
    const clashes = busy.reduce((n, iv) => (conflictsWithGap(cand, iv) ? n + 1 : n), 0);
    return { time, available: clashes < BOOKING.slotCapacity };
  });
}

/** Ar konkretus pradžios laikas laisvas (naudojama prieš kuriant rezervaciją). */
export async function isSlotAvailable(date: string, time: string, query: AvailabilityQuery): Promise<boolean> {
  const all = await getAvailability(date, query);
  return all.some((s) => s.time === time && s.available);
}
