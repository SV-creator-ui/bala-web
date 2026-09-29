/**
 * Vienkartinis senų (Moizmo) gimtadienių klientų importas metinių priminimams.
 *
 * Skaito Moizmo užsakymų CSV, kiekvienam el. paštui randa paskutinę gimtadienio
 * šventės datą ir (su --apply) įrašo sentinel eilutę į `blackouts`
 * (date = 1900-01-13, time = el. paštas, reason = JSON).
 *
 * PAGAL NUTYLĖJIMĄ NIEKO NEĮRAŠO — tik parodo, ką įrašytų. Realus įrašymas: --apply.
 * Šis skriptas NIEKADA nesiunčia laiškų.
 *
 * Naudojimas:
 *   node scripts/import-historic-clients.mjs <moizmo-uzsakymai.csv>            (peržiūra)
 *   node scripts/import-historic-clients.mjs <moizmo-uzsakymai.csv> --apply    (įrašo)
 */
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const HIST_CLIENT_DATE = "1900-01-13";
const ROOM_CLIENT_DATE = "1900-01-15";
const OWN = new Set(["sarunas.valius@gmail.com", "bala.pramogos@gmail.com"]);
const apply = process.argv.includes("--apply");
const kindIdx = process.argv.indexOf("--kind");
const kind = kindIdx > -1 ? process.argv[kindIdx + 1] : "party"; // party | room
const sinceIdx = process.argv.indexOf("--since");
const since = sinceIdx > -1 ? process.argv[sinceIdx + 1] : "0000-00-00"; // importuoti tik šią datą ir vėlesnes šventes
const file = process.argv.find((a, i) => i >= 2 && !a.startsWith("--") && process.argv[i - 1] !== "--since" && process.argv[i - 1] !== "--kind");
if (!file) {
  console.error("Nurodykite Moizmo užsakymų CSV kelią.");
  process.exit(1);
}

/** Minimalus CSV skaitytuvas (kabutės, kableliai lauke). */
function parseCsv(text) {
  const rows = [];
  let row = [], cur = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { cur += '"'; i++; }
      else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { row.push(cur); cur = ""; }
    else if (c === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; }
    else if (c !== "\r") cur += c;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  return rows;
}

const isBirthday = (p) => /maksi|midi|vip paketas|gold/i.test(p) && !/\+30 min/i.test(p);
const isRoomOrGame = (p) => /pabėgimo|vr room|veiksmo|3 žaidimai|akcija/i.test(p);
const matches = kind === "room" ? isRoomOrGame : isBirthday;

const raw = readFileSync(file, "utf8").replace(/^﻿/, "");
const [head, ...body] = parseCsv(raw);
const idx = Object.fromEntries(head.map((h, i) => [h, i]));
const clients = new Map();
for (const r of body) {
  if (!r[idx.id]) continue;
  if (!["Confirmed", "Completed"].includes(r[idx.status])) continue;
  if (!matches(r[idx.product] || "")) continue;
  const email = (r[idx.email] || "").trim().toLowerCase();
  if (!email || OWN.has(email)) continue;
  const date = (r[idx.date] || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
  const cur = clients.get(email);
  if (kind === "room") {
    if (!cur) clients.set(email, { name: (r[idx.name] || "").trim() || "svety", last_party_date: date, visits: 1, source: "moizmo" });
    else { cur.visits++; if (date > cur.last_party_date) { cur.last_party_date = date; cur.name = (r[idx.name] || "").trim() || cur.name; } }
  } else if (!cur || date > cur.last_party_date) {
    clients.set(email, { name: (r[idx.name] || "").trim() || "svety", last_party_date: date, source: "moizmo" });
  }
}
for (const [e, c] of [...clients]) if (c.last_party_date < since) clients.delete(e);
console.log(`Klientų (unikalių el. paštų, ${kind === "room" ? "apsilankymas" : "šventė"} nuo ${since}): ${clients.size}`);

// --- peržiūra ---
const today = new Date().toISOString().slice(0, 10);
const pad = (n) => String(n).padStart(2, "0");
const isLeap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function nextAnniv(last) {
  const [y, m, d] = last.split("-").map(Number);
  for (let n = 1; n <= 15; n++) {
    const yy = y + n, dd = m === 2 && d === 29 && !isLeap(yy) ? 28 : d;
    const iso = `${yy}-${pad(m)}-${pad(dd)}`;
    if (iso >= today) return iso;
  }
}
const daysTo = (iso) => Math.round((Date.parse(iso) - Date.parse(today)) / 86400000);
let inWindow = 0;
const buckets = { "0–13 d.": 0, "14–35 d. (gaus dabar)": 0, "36–90 d.": 0, "91–365 d.": 0 };
for (const c of kind === "room" ? [] : clients.values()) {
  const d = daysTo(nextAnniv(c.last_party_date));
  if (d < 14) buckets["0–13 d."]++;
  else if (d <= 35) { buckets["14–35 d. (gaus dabar)"]++; inWindow++; }
  else if (d <= 90) buckets["36–90 d."]++;
  else buckets["91–365 d."]++;
}
if (kind !== "room") console.log("Iki artimiausių metinių:", buckets);
else { const recent = (n) => [...clients.values()].filter((c) => daysTo(c.last_party_date) >= -n && daysTo(c.last_party_date) <= -14).length; console.log("Apsilankymas prieš 14–60 d.:", recent(60), "| 14–180 d.:", recent(180), "| iš viso:", clients.size); }

if (!apply) {
  console.log("\n[PERŽIŪRA] Nieko neįrašyta. Norėdami įrašyti, paleiskite su --apply.");
  process.exit(0);
}

// --- įrašymas ---
const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/).filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")]; }),
);
const sb = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const TARGET_DATE = kind === "room" ? ROOM_CLIENT_DATE : HIST_CLIENT_DATE;
const payload = (c) => kind === "room" ? { name: c.name, last_visit_date: c.last_party_date, visits: c.visits, source: c.source } : c;
const { data: existing, error: exErr } = await sb.from("blackouts").select("id, time, reason").eq("date", TARGET_DATE);
if (exErr) { console.error("Nepavyko perskaityti esamų:", exErr.message); process.exit(1); }
const have = new Map(existing.map((r) => [r.time, r]));

let inserted = 0, updated = 0, skipped = 0;
for (const [email, c] of clients) {
  const prev = have.get(email);
  if (!prev) {
    const { error } = await sb.from("blackouts").insert({ date: TARGET_DATE, time: email, reason: JSON.stringify(payload(c)) });
    if (error) { console.error("Klaida:", email.slice(0, 2) + "***", error.message); continue; }
    inserted++;
  } else {
    let old; try { old = JSON.parse(prev.reason); } catch { old = null; }
    if (old && (old.last_party_date ?? old.last_visit_date) >= c.last_party_date) { skipped++; continue; }
    const { error } = await sb.from("blackouts").update({ reason: JSON.stringify(payload(c)) }).eq("id", prev.id);
    if (error) { console.error("Klaida:", email.slice(0, 2) + "***", error.message); continue; }
    updated++;
  }
}
console.log(`Įrašyta: naujų ${inserted}, atnaujinta ${updated}, praleista ${skipped}.`);
