/* eslint-disable @typescript-eslint/no-require-imports */
// Destructive only to a dedicated LOCAL PostgreSQL database.
const fs = require("node:fs");
const path = require("node:path");
const { Client } = require(process.env.PG_MODULE_PATH || "pg");

const url = new URL(process.env.TEST_DATABASE_URL || "");
if (!["127.0.0.1", "localhost"].includes(url.hostname)) {
  throw new Error("TEST_DATABASE_URL must point to a local PostgreSQL instance");
}

const root = path.resolve(__dirname, "..");
const sqlFiles = [
  "supabase/schema.sql",
  "supabase/migration_002_packages.sql",
  "supabase/migration_003_gcal.sql",
  "supabase/migration_004_emails.sql",
  "supabase/migration_005_vouchers.sql",
  "supabase/migration_006_invitations.sql",
  "supabase/migration_007_booking_exclusion.sql",
  "supabase/migration_008_atomic_discounts.sql",
];

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function booking(ref, date, time, extra = {}) {
  return {
    type: "room", package_id: null, date, time, block_start: time, block_end: time,
    players: 2, addons: [], customer_name: "Test User",
    customer_phone: "+37060000000", customer_email: "test@example.com", note: null,
    base_total_eur: 80, base_deposit_eur: 30, total_eur: 80, deposit_eur: 30,
    status: "pending", merchant_reference: ref, voucher_code: null,
    voucher_discount_eur: 0, promo_code: null, promo_discount_eur: 0,
    invitation_type: null, invitation_lang: null, celebrant_name: null,
    celebrant_age: null, ...extra,
  };
}

async function expectCode(promise, code, label) {
  try {
    await promise;
  } catch (error) {
    assert(error.code === code, label + ": expected " + code + ", got " + (error.code || error.message));
    return;
  }
  throw new Error(label + ": expected query to fail");
}

async function createBooking(client, payload) {
  return client.query("select * from public.create_booking_guarded($1::jsonb)", [JSON.stringify(payload)]);
}

async function addVoucher(client, code, status = "active", amount = 40) {
  await client.query(
    "insert into public.vouchers " +
    "(code,amount_eur,status,buyer_name,buyer_email,valid_until,merchant_reference) " +
    "values ($1,$2,$3,'Buyer','buyer@example.com',date '2099-12-31',$4)",
    [code, amount, status, "GIFT-" + code],
  );
}

async function addPromo(client, code, maxUses, usedCount) {
  const promo = {
    code, kind: "manual", discount_type: "fixed", discount_value: 20,
    assigned_email: "", applies_to: ["room", "game", "party"],
    valid_from: "2000-01-01", valid_until: "2099-12-31",
    issued_at: new Date().toISOString(), used_at: usedCount ? new Date().toISOString() : null,
    used_booking_id: null, used_booking_ref: null, source_booking_id: null,
    cancelled: false, min_visits_required: 0, allow_voucher_stack: false,
    max_uses: maxUses, used_count: usedCount,
  };
  await client.query(
    "insert into public.blackouts(date,time,reason) values (date '1900-01-03',$1,$2)",
    [code, JSON.stringify(promo)],
  );
}

async function main() {
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  await admin.query("drop schema public cascade; create schema public");
  await admin.query(
    "do $$ begin " +
    "if not exists (select 1 from pg_roles where rolname='anon') then create role anon nologin; end if; " +
    "if not exists (select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if; " +
    "if not exists (select 1 from pg_roles where rolname='service_role') then create role service_role nologin; end if; " +
    "end $$;",
  );
  for (const file of sqlFiles.slice(0, -1)) {
    await admin.query(fs.readFileSync(path.join(root, file), "utf8"));
  }

  // Seed rows written by the pre-migration app, then test migration backfill.
  await addVoucher(admin, "LEGACY-V", "active", 10);
  await createBooking(admin, booking("LEGACY-V-REF", "2030-01-01", "10:00", {
    voucher_code: "LEGACY-V", voucher_discount_eur: 10,
  }));
  await addPromo(admin, "LEGACY-P", 2, 0);
  await createBooking(admin, booking("LEGACY-P-REF", "2030-01-02", "10:00", {
    note: "[PROMO:LEGACY-P:-20.00€]", total_eur: 60, deposit_eur: 30,
  }));
  await addPromo(admin, "LEGACY-PAID", 2, 1);
  await createBooking(admin, booking("LEGACY-PAID-REF", "2030-01-03", "10:00", {
    note: "[PROMO:LEGACY-PAID:-20.00€]", total_eur: 60, deposit_eur: 30, status: "paid",
  }));

  const preflight = await admin.query(
    fs.readFileSync(path.join(root, "supabase/discount_p1_preflight.sql"), "utf8"),
  );
  const preflightResults = Array.isArray(preflight) ? preflight : [preflight];
  assert(preflightResults
    .filter((result) => result.command === "SELECT")
    .every((result) => result.rowCount === 0), "preflight reported a conflict for valid legacy data");

  await admin.query(fs.readFileSync(path.join(root, sqlFiles.at(-1)), "utf8"));
  const legacyClaims = await admin.query(
    "select 'voucher' kind,state from public.voucher_booking_claims where booking_ref='LEGACY-V-REF' " +
    "union all select 'promo',state from public.promo_booking_claims where booking_ref in ('LEGACY-P-REF','LEGACY-PAID-REF')",
  );
  assert(legacyClaims.rows.filter((r) => r.state === "reserved").length === 2,
    "migration must reserve legacy pending discounts");
  assert(legacyClaims.rows.filter((r) => r.state === "redeemed").length === 1,
    "migration must seed legacy paid promo idempotency");

  const a = new Client({ connectionString: url.toString() });
  const b = new Client({ connectionString: url.toString() });
  await Promise.all([a.connect(), b.connect()]);

  await addVoucher(admin, "ONE-VOUCHER");
  const voucherRace = await Promise.allSettled([
    createBooking(a, booking("V-RACE-1", "2031-01-10", "10:00", {
      voucher_code: "ONE-VOUCHER", voucher_discount_eur: 40,
    })),
    createBooking(b, booking("V-RACE-2", "2031-01-11", "10:00", {
      voucher_code: "ONE-VOUCHER", voucher_discount_eur: 40,
    })),
  ]);
  assert(voucherRace.filter((r) => r.status === "fulfilled").length === 1, "voucher race must have one winner");
  assert(voucherRace.filter((r) => r.status === "rejected" && r.reason.code === "P0002").length === 1,
    "voucher race loser must be P0002");

  await addPromo(admin, "ONE-PROMO", 1, 0);
  const promoRace = await Promise.allSettled([
    createBooking(a, booking("P-RACE-1", "2031-01-12", "10:00", {
      promo_code: "ONE-PROMO", promo_discount_eur: 20, total_eur: 60,
    })),
    createBooking(b, booking("P-RACE-2", "2031-01-13", "10:00", {
      promo_code: "ONE-PROMO", promo_discount_eur: 20, total_eur: 60,
    })),
  ]);
  assert(promoRace.filter((r) => r.status === "fulfilled").length === 1, "promo race must have one winner");
  assert(promoRace.filter((r) => r.status === "rejected" && r.reason.code === "P0002").length === 1,
    "promo race loser must be P0002");

  await expectCode(createBooking(admin, booking("BAD-V", "2031-01-14", "10:00", {
    voucher_code: "MISSING", voucher_discount_eur: 40,
  })), "P0002", "invalid voucher");
  await addVoucher(admin, "USED-VOUCHER", "redeemed");
  await expectCode(createBooking(admin, booking("USED-V", "2031-01-15", "10:00", {
    voucher_code: "USED-VOUCHER", voucher_discount_eur: 40,
  })), "P0002", "used voucher");

  await addPromo(admin, "FULL-PROMO", 1, 1);
  await expectCode(createBooking(admin, booking("FULL-P", "2031-01-16", "10:00", {
    promo_code: "FULL-PROMO", promo_discount_eur: 20, total_eur: 60,
  })), "P0002", "promo usage limit");

  await addVoucher(admin, "ROLLBACK-V");
  await expectCode(createBooking(admin, booking("ROLLBACK-V-BAD", "2031-01-17", "10:00", {
    players: 99, voucher_code: "ROLLBACK-V", voucher_discount_eur: 40,
  })), "23514", "voucher booking rollback");
  await createBooking(admin, booking("ROLLBACK-V-OK", "2031-01-17", "11:30", {
    voucher_code: "ROLLBACK-V", voucher_discount_eur: 40,
  }));

  await addPromo(admin, "ROLLBACK-P", 1, 0);
  await expectCode(createBooking(admin, booking("ROLLBACK-P-BAD", "2031-01-18", "10:00", {
    players: 99, promo_code: "ROLLBACK-P", promo_discount_eur: 20, total_eur: 60,
  })), "23514", "promo booking rollback");
  await createBooking(admin, booking("ROLLBACK-P-OK", "2031-01-18", "11:30", {
    promo_code: "ROLLBACK-P", promo_discount_eur: 20, total_eur: 60,
  }));

  const plain = await createBooking(admin, booking("PLAIN", "2031-01-19", "10:00"));
  assert(Number(plain.rows[0].total_eur) === 80, "plain booking total changed");
  assert(Number(plain.rows[0].deposit_eur) === 30, "plain booking deposit changed");

  await addPromo(admin, "CALLBACK-P", 2, 0);
  await createBooking(admin, booking("CALLBACK-REF", "2031-01-20", "10:00", {
    promo_code: "CALLBACK-P", promo_discount_eur: 20, total_eur: 60,
  }));
  const firstSettle = await admin.query("select public.settle_booking_guarded('CALLBACK-REF') outcome");
  const secondSettle = await admin.query("select public.settle_booking_guarded('CALLBACK-REF') outcome");
  const callbackBooking = await admin.query(
    "select id from public.bookings where merchant_reference='CALLBACK-REF'",
  );
  await admin.query("select public.settle_booking_promo_guarded($1,'CALLBACK-P')", [callbackBooking.rows[0].id]);
  const promoCount = await admin.query(
    "select (reason::jsonb->>'used_count')::int n from public.blackouts " +
    "where date=date '1900-01-03' and time='CALLBACK-P'",
  );
  assert(firstSettle.rows[0].outcome === "paid", "first callback must pay");
  assert(secondSettle.rows[0].outcome === "already_paid", "repeated callback must be idempotent");
  assert(promoCount.rows[0].n === 1, "repeated callback incremented promo twice");
  await expectCode(admin.query(
    "update public.blackouts set reason=jsonb_set(reason::jsonb,'{used_count}','0'::jsonb)::text " +
    "where date=date '1900-01-03' and time='CALLBACK-P'",
  ), "40001", "stale promo admin update");

  await Promise.all([a.end(), b.end()]);
  await admin.end();
  console.log("PASS migration 008 atomic discount regression suite");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
