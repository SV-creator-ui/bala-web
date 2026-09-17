// Regression testas Paysera webhook parseriui.
// Paleisti iš bala-web/ katalogo: `node scripts/test-paysera-webhook.mjs`.
// Testas patvirtina, kad `parsePayseraWebhook` teisingai apdoroja tikrą
// Paysera Modern payload'ą (žr. 2026-09-17 incidentą su
// BALA-1789650789730-z5606) ir vis dar palaiko senesnius formatus.

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
  vm.runInNewContext(
    output,
    {
      module: loadedModule,
      exports: loadedModule.exports,
      require: mockRequire,
      __dirname: path.dirname(filename),
      __filename: filename,
      console,
    },
    { filename },
  );
  return loadedModule.exports;
}

const { parsePayseraWebhook } = loadTs("src/lib/paysera.ts");

// -----------------------------------------------------------------------------
// 1) Tikras production webhook (2026-09-17 incidentas)
// -----------------------------------------------------------------------------
const productionWebhook = JSON.stringify({
  event: { name: "amount_paid_updated", type: "order" },
  order: {
    paysera_order_id: "01a0af7f-eb69-7a22-9f27-8bb50961efcb",
    merchant_order_id: "BALA-1789650789730-z5606",
    amount: 5000,
    amount_paid: 5000,
    currency: "EUR",
    status: "paid",
  },
});
const parsed = parsePayseraWebhook(productionWebhook);
assert.notEqual(parsed, null, "production webhook must not parse to null");
assert.equal(
  parsed.merchantReference,
  "BALA-1789650789730-z5606",
  "merchantReference must come from order.merchant_order_id",
);
assert.equal(
  parsed.paid,
  true,
  "status='paid' + amount_paid==amount must be treated as paid",
);
assert.equal(
  parsed.orderId,
  "01a0af7f-eb69-7a22-9f27-8bb50961efcb",
  "orderId must come from order.paysera_order_id",
);
console.log("PASS: production amount_paid_updated (merchant_order_id + paysera_order_id + status=paid)");

// -----------------------------------------------------------------------------
// 2) order_updated Paysera Modern webhook (be status, tik amount_paid==amount)
// -----------------------------------------------------------------------------
const orderUpdated = JSON.stringify({
  event: { name: "order_updated", type: "order" },
  order: {
    paysera_order_id: "aaaa1111-bbbb-2222-cccc-333344445555",
    merchant_order_id: "BALA-ORDER-UPDATED",
    amount: 3000,
    amount_paid: 3000,
    currency: "EUR",
  },
});
const orderUpdatedParsed = parsePayseraWebhook(orderUpdated);
assert.notEqual(orderUpdatedParsed, null);
assert.equal(orderUpdatedParsed.merchantReference, "BALA-ORDER-UPDATED");
assert.equal(orderUpdatedParsed.paid, true, "amount_paid==amount must infer paid without status");
console.log("PASS: order_updated without status but amount_paid == amount");

// -----------------------------------------------------------------------------
// 3) payment_updated Paysera Modern webhook (autorizuotas, dar neapmokėtas)
// -----------------------------------------------------------------------------
const paymentAuthorized = JSON.stringify({
  event: { name: "payment_updated", type: "payment" },
  order: {
    paysera_order_id: "eeee5555-ffff-6666-aaaa-777788889999",
    merchant_order_id: "BALA-AUTH-ONLY",
    amount: 5000,
    amount_paid: 0,
    currency: "EUR",
    status: "authorized",
  },
});
const paymentAuthorizedParsed = parsePayseraWebhook(paymentAuthorized);
assert.notEqual(paymentAuthorizedParsed, null);
assert.equal(paymentAuthorizedParsed.merchantReference, "BALA-AUTH-ONLY");
assert.equal(paymentAuthorizedParsed.paid, false, "authorized status must NOT be treated as paid");
console.log("PASS: payment_updated with authorized status is not paid");

// -----------------------------------------------------------------------------
// 4) Legacy CREATE formatas — reference įdėtas į purchase
// -----------------------------------------------------------------------------
const legacyCreate = JSON.stringify({
  order: {
    order_id: "legacy-order-create",
    status: "paid",
    purchase: { reference: "BALA-LEGACY-CREATE", amount: 3000 },
  },
});
const legacyCreateParsed = parsePayseraWebhook(legacyCreate);
assert.notEqual(legacyCreateParsed, null);
assert.equal(legacyCreateParsed.merchantReference, "BALA-LEGACY-CREATE");
assert.equal(legacyCreateParsed.paid, true);
assert.equal(legacyCreateParsed.orderId, "legacy-order-create");
console.log("PASS: legacy CREATE format still parses");

// -----------------------------------------------------------------------------
// 5) Legacy GET formatas — top-level reference + balance_due
// -----------------------------------------------------------------------------
const legacyGet = JSON.stringify({
  order: {
    id: "legacy-order-get",
    reference: "BALA-LEGACY-GET",
    status: "processing",
    balance_due: 0,
    amount_paid: 3000,
  },
});
const legacyGetParsed = parsePayseraWebhook(legacyGet);
assert.notEqual(legacyGetParsed, null);
assert.equal(legacyGetParsed.merchantReference, "BALA-LEGACY-GET");
assert.equal(legacyGetParsed.paid, true, "balance_due<=0 && amount_paid>0 must infer paid");
assert.equal(legacyGetParsed.orderId, "legacy-order-get");
console.log("PASS: legacy GET format still parses");

// -----------------------------------------------------------------------------
// 6) merchant_order_id turi pirmenybę prieš purchase.reference
// -----------------------------------------------------------------------------
const mixedFormat = JSON.stringify({
  order: {
    merchant_order_id: "BALA-MODERN-WINS",
    paysera_order_id: "xxxx0000",
    status: "paid",
    amount: 5000,
    amount_paid: 5000,
    purchase: { reference: "BALA-OLD-SHOULD-BE-IGNORED" },
  },
});
const mixedFormatParsed = parsePayseraWebhook(mixedFormat);
assert.equal(mixedFormatParsed.merchantReference, "BALA-MODERN-WINS");
console.log("PASS: merchant_order_id takes priority over purchase.reference");

// -----------------------------------------------------------------------------
// 7) Nėra reference — parseris privalo grąžinti null (silent-parse ochrana)
// -----------------------------------------------------------------------------
assert.equal(
  parsePayseraWebhook(JSON.stringify({ order: { status: "paid" } })),
  null,
  "missing reference must return null",
);
console.log("PASS: missing reference returns null");

// -----------------------------------------------------------------------------
// 8) Netinkamas JSON — parseris privalo grąžinti null
// -----------------------------------------------------------------------------
assert.equal(parsePayseraWebhook("not-json"), null);
console.log("PASS: invalid JSON returns null");

console.log("ALL PASS: 8 scenarios");
