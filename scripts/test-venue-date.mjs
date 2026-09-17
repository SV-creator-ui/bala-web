import assert from "node:assert/strict";
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import ts from "typescript";

const nodeRequire = createRequire(import.meta.url);
const root = path.resolve(import.meta.dirname, "..");

function loadTs(relativePath, mocks = {}) {
  const filename = path.join(root, relativePath);
  const source = fs.readFileSync(filename, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
    fileName: filename,
  }).outputText;
  const loadedModule = { exports: {} };
  const mockRequire = (id) => {
    if (Object.hasOwn(mocks, id)) return mocks[id];
    return nodeRequire(id);
  };
  vm.runInNewContext(output, {
    module: loadedModule,
    exports: loadedModule.exports,
    require: mockRequire,
    __dirname: path.dirname(filename),
    __filename: filename,
    console,
  }, { filename });
  return loadedModule.exports;
}

const midnightUtc = new Date("2026-09-16T21:30:00.000Z");
const { venueNow } = loadTs("src/lib/booking/config.ts");
assert.equal(venueNow(midnightUtc).date, "2026-09-17", "Vilnius 00:30 must be the next calendar date");

const venueDate = "2026-09-17";
let promo;
const promoModule = loadTs("src/lib/promo/redeem.ts", {
  "@/lib/booking/config": { venueNow: () => ({ date: venueDate, min: 30 }) },
  "@/lib/supabase/server": { getSupabaseAdmin: () => { throw new Error("not used"); } },
  "./storage": {
    findPromoByCode: async () => promo,
    countPaidRoomGameVisits: async () => 0,
    normalizeEmail: (value) => value.trim().toLowerCase(),
  },
});

const promoBase = {
  code: "TEST",
  cancelled: false,
  max_uses: 1,
  used_count: 0,
  used_at: null,
  valid_from: venueDate,
  valid_until: "2026-09-30",
  applies_to: ["room"],
  assigned_email: "",
  allow_voucher_stack: false,
  min_visits_required: 0,
  discount_type: "fixed",
  discount_value: 10,
};
const promoInput = {
  code: "TEST",
  email: "test@example.com",
  type: "room",
  total: 100,
  hasVoucher: false,
};

promo = { ...promoBase };
assert.equal((await promoModule.validatePromoForBooking(promoInput)).ok, true,
  "valid_from today must work at Vilnius 00:30 while UTC is yesterday");

promo = { ...promoBase, valid_from: "2026-09-01", valid_until: "2026-09-16" };
const expired = await promoModule.validatePromoForBooking(promoInput);
assert.equal(expired.ok, false, "valid_until yesterday must be expired");
assert.equal(expired.error, "Kodo galiojimas pasibaigė");

const { validFutureDate } = loadTs("src/lib/booking/validation.ts", {
  "@/lib/booking/config": { venueNow: () => ({ date: venueDate, min: 30 }) },
});
assert.equal(validFutureDate("2026-09-17"), true, "today in Vilnius must be valid");
assert.equal(validFutureDate("2026-09-16"), false, "yesterday in Vilnius must be invalid");
assert.equal(validFutureDate("2026-09-18"), true, "tomorrow must be valid");

const sql = fs.readFileSync(path.join(root, "supabase/migration_011_promo_venue_date.sql"), "utf8");
assert.match(sql, /venue_today date := timezone\('Europe\/Vilnius', statement_timestamp\(\)\)::date;/);
assert.doesNotMatch(sql, /utc_today|timezone\('UTC'/);

console.log("PASS: 5 venue-date scenarios and migration timezone assertions");
