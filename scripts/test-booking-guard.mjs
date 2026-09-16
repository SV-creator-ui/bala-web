// Run from bala-web. Requires pg in an EXTERNAL test runtime (no app dependency).
// PG_TEST_RUNTIME=<directory containing node_modules>, PG_TEST_PORT=<local port>.
// Always creates and drops its OWN database on 127.0.0.1. Never reads app .env.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

assert.ok(process.env.PG_TEST_RUNTIME, 'Set PG_TEST_RUNTIME to the isolated test runtime');
const { Client } = createRequire(path.join(process.env.PG_TEST_RUNTIME, 'test.cjs'))('pg');
const config = { host: '127.0.0.1', port: Number(process.env.PG_TEST_PORT || 55439), user: 'postgres', password: '', database: 'postgres', connectionTimeoutMillis: 5000 };
const root = new Client(config);
const dbName = `bala_guard_test_${process.pid}_${Date.now()}`;
const connections = [];
let passed = 0;
function pass(name) { passed++; console.log(`PASS ${name}`); }
async function connection() {
  const c = new Client({ ...config, database: dbName });
  await c.connect();
  await c.query("set statement_timeout = '10s'");
  connections.push(c);
  return c;
}
const modules = new Map();
function loadTs(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const exports = {};
  modules.set(file, exports);
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(code, { exports, require: name => loadTs(path.resolve(path.dirname(file), name + '.ts')) }, { filename: file });
  return exports;
}
await root.connect();
await root.query("set statement_timeout = '15s'");
try {
  // Supabase roles for migration grants; local test cluster only.
  await root.query("do $$ begin create role anon; exception when duplicate_object then null; end $$; do $$ begin create role authenticated; exception when duplicate_object then null; end $$; do $$ begin create role service_role bypassrls; exception when duplicate_object then null; end $$;");
  await root.query(`create database ${dbName}`);
  const db = await connection();
  const a = await connection();
  const b = await connection();
  for (const file of ['schema.sql', 'migration_002_packages.sql', 'migration_003_gcal.sql', 'migration_004_emails.sql', 'migration_005_vouchers.sql', 'migration_006_invitations.sql']) {
    await db.query(fs.readFileSync(path.join('supabase', file), 'utf8'));
  }
  const migration = fs.readFileSync('supabase/migration_007_booking_exclusion.sql', 'utf8');
  await db.query("insert into bookings(date,time,players,customer_name,customer_phone,customer_email,total_eur,deposit_eur,status,merchant_reference) values ('2030-06-10','14:00',2,'Test','test','test',40,30,'paid','preflight-a'),('2030-06-10','14:30',2,'Test','test','test',40,30,'paid','preflight-b')");
  await assert.rejects(db.query(migration), { code: '23P01' });
  await db.query('rollback');
  assert.equal((await db.query('select count(*)::int as n from bookings')).rows[0].n, 2);
  assert.equal((await db.query("select count(*)::int as n from information_schema.columns where table_name='bookings' and column_name='guard_before'")).rows[0].n, 0);
  pass('migration refuses existing paid overlaps and rolls back without losing bookings');
  await db.query('truncate bookings');
  await db.query(migration);
  pass('migration runs on clean repository schema');
  const fixture = (ref, time = '14:00', extra = {}) => ({ type: 'room', date: '2030-06-10', time, players: 2, addons: [], customer_name: 'Test', customer_phone: '+37060000000', customer_email: 'test@example.test', total_eur: 40, deposit_eur: 30, status: 'pending', merchant_reference: ref, ...extra });
  const insert = (c, row) => c.query('select * from public.create_booking_guarded($1::jsonb)', [JSON.stringify(row)]);
  const settle = async (c, ref) => (await c.query('select public.settle_booking_guarded($1) as result', [ref])).rows[0].result;
  const reset = () => db.query('truncate public.bookings');
  const age = async ref => {
    // Only the isolated fixture bypasses the immutable hold-start trigger to
    // simulate time passing without waiting 30 minutes. Constraints stay active.
    await db.query("set session_replication_role = replica");
    try { await db.query("update public.bookings set created_at = clock_timestamp() - interval '31 minutes' where merchant_reference=$1", [ref]); }
    finally { await db.query('set session_replication_role = origin'); }
  };
  async function waitForLock(client) {
    for (let i = 0; i < 100; i++) {
      const r = await db.query('select wait_event_type from pg_stat_activity where pid=$1', [client.processID]);
      if (r.rows[0]?.wait_event_type === 'Lock') return;
      await new Promise(resolve => setTimeout(resolve, 20));
    }
    assert.fail('Second connection did not wait on the first transaction');
  }
  for (const secondTime of ['14:00', '14:30']) {
    await reset();
    await a.query('begin');
    await insert(a, fixture('first'));
    const second = insert(b, fixture('second', secondTime)).then(() => null, error => error);
    await waitForLock(b);
    await a.query('commit');
    assert.equal((await second)?.code, '23P01');
    assert.equal((await db.query('select count(*)::int as n from bookings')).rows[0].n, 1);
    pass(`two actual concurrent connections: overlapping ${secondTime} rejected`);
  }
  await reset();
  await a.query('begin');
  await insert(a, fixture('first'));
  await insert(b, fixture('second', '15:00'));
  await a.query('commit');
  pass('concurrent non-overlapping bookings both accepted');
  await reset();
  await insert(db, fixture('hold'));
  assert.equal((await db.query("select count(*)::int as n from active_bookings_for_date('2030-06-10')")).rows[0].n, 1);
  await assert.rejects(insert(db, fixture('blocked')), { code: '23P01' });
  pass('unexpired pending blocks inventory');
  await age('hold');
  assert.equal((await db.query("select count(*)::int as n from active_bookings_for_date('2030-06-10')")).rows[0].n, 0);
  await insert(db, fixture('replacement'));
  assert.equal((await db.query("select status from bookings where merchant_reference='hold'")).rows[0].status, 'expired');
  pass('expired hold is released atomically on the next claim');
  assert.equal(await settle(db, 'hold'), 'conflict');
  const conflict = (await db.query("select * from bookings where merchant_reference='hold'")).rows[0];
  assert.equal(conflict.status, 'expired');
  assert.ok(conflict.payment_conflict_at);
  assert.match(conflict.note, /PAYMENT_CONFLICT/);
  await db.query("update bookings set status='cancelled' where merchant_reference='replacement'");
  assert.equal(await settle(db, 'hold'), 'conflict');
  pass('late payment versus active pending: persistent conflict, repeated callback cannot revive it');
  for (const targetStatus of ['pending', 'expired']) {
    await reset();
    await insert(db, fixture('late'));
    await age('late');
    if (targetStatus === 'expired') await db.query('select expire_pending_bookings()');
    assert.equal(await settle(db, 'late'), 'paid');
    assert.equal(await settle(db, 'late'), 'already_paid');
    pass(`late ${targetStatus} payment with free slot and duplicate callback`);
  }
  await reset();
  await insert(db, fixture('late'));
  await age('late');
  await insert(db, fixture('winner', '14:30', { status: 'paid' }));
  assert.equal(await settle(db, 'late'), 'conflict');
  pass('late payment cannot overlap another paid booking');
  await reset();
  await insert(db, fixture('same'));
  await a.query('begin');
  assert.equal(await settle(a, 'same'), 'paid');
  const duplicate = settle(b, 'same');
  await waitForLock(b);
  await a.query('commit');
  assert.equal(await duplicate, 'already_paid');
  pass('concurrent duplicate callbacks serialize on the booking row');
  await reset();
  await insert(db, fixture('late'));
  await age('late');
  await a.query('begin');
  await insert(a, fixture('new'));
  const late = settle(b, 'late');
  await waitForLock(b);
  await a.query('commit');
  assert.equal(await late, 'conflict');
  pass('late payment races a new uncommitted booking: one owner only');
  await reset();
  await insert(db, fixture('one', '14:00', { status: 'paid' }));
  await insert(db, fixture('two', '16:00', { status: 'paid' }));
  await assert.rejects(db.query("update bookings set time='14:30' where merchant_reference='two'"), { code: '23P01' });
  await insert(db, fixture('cancelled', '18:00'));
  await db.query("update bookings set status='cancelled', time='14:30' where merchant_reference='cancelled'");
  await assert.rejects(db.query("update bookings set status='paid' where merchant_reference='cancelled'"), { code: '23P01' });
  pass('direct admin rescheduling and status updates cannot bypass exclusion');

  // Compare SQL constraint mathematics with unchanged TypeScript business rules.
  const { activeInterval, conflictsWithGap } = loadTs('src/lib/booking/window.ts');
  assert.equal(loadTs('src/lib/booking/config.ts').BOOKING.pendingHoldMin, 30);
  const variants = [{ type: 'room' }, { type: 'game' }, ...['maksi','vip','gold'].flatMap(pkg => [{ type: 'party', pkg }, { type: 'party', pkg, addons: ['extratime'] }])];
  let comparisons = 0;
  for (const x of variants) for (const y of variants) for (const time of ['10:00','10:30','11:00','12:00','12:15','12:30','12:45','13:00','13:15','13:30','14:00']) {
    const args = ['2030-06-10', '10:00', x.type, x.pkg ?? null, JSON.stringify(x.addons ?? []), time, y.type, y.pkg ?? null, JSON.stringify(y.addons ?? [])];
    const { rows } = await db.query("select (booking_guard_range($1,$2,$3,$4,$5,'paid',true) && booking_guard_range($1,$6,$7,$8,$9,'paid',true)) or (booking_guard_range($1,$2,$3,$4,$5,'paid',false) && booking_guard_range($1,$6,$7,$8,$9,'paid',false)) as clash", args);
    const expected = conflictsWithGap({ ...activeInterval(x.type, '10:00', x.pkg, x.addons), type: x.type }, { ...activeInterval(y.type, time, y.pkg, y.addons), type: y.type });
    assert.equal(rows[0].clash, expected, JSON.stringify(args));
    comparisons++;
  }
  pass(`${comparisons} SQL/TypeScript interval + gap parity cases (including game)`);
  assert.equal((await db.query("select has_function_privilege('anon','public.settle_booking_guarded(text)','EXECUTE') as allowed")).rows[0].allowed, false);
  pass('public RPC execution denied to anon');
  await reset();
  await db.query('grant all on public.bookings to service_role; set role service_role');
  try {
    await insert(db, fixture('service-role'));
    assert.equal(await settle(db, 'service-role'), 'paid');
  } finally { await db.query('reset role'); }
  pass('service_role can invoke guarded creation and settlement with generated ranges');
  // Exercise the real callback/settlement modules with a local DB adapter.
  // Payment signature/provider and downstream integrations are isolated stubs.
  function moduleWithDeps(file, deps) {
    const exports = {};
    const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
    vm.runInNewContext(code, { exports, Response, console: { error() {}, warn() {} }, require: name => {
      assert.ok(name in deps, `Unexpected dependency ${name}`);
      return deps[name];
    } });
    return exports;
  }
  const conflictModule = moduleWithDeps('src/lib/booking/conflict.ts', {});
  let effects = 0;
  const effect = async () => { effects++; };
  const adapter = {
    async rpc(name, { p_ref }) {
      assert.equal(name, 'settle_booking_guarded');
      return { data: await settle(db, p_ref), error: null };
    },
    from(table) {
      assert.equal(table, 'bookings');
      return { select: () => ({ eq: (column, ref) => {
        assert.equal(column, 'merchant_reference');
        return { single: async () => ({ data: (await db.query('select * from bookings where merchant_reference=$1', [ref])).rows[0], error: null }) };
      } }) };
    }
  };
  const settlement = moduleWithDeps('src/lib/booking/settle.ts', {
    '@/lib/supabase/server': { getSupabaseAdmin: () => adapter },
    './conflict': conflictModule,
    './calendar-sync': { syncBookingCalendarByRef: effect }, './notify': { notifyBookingPaidByRef: effect },
    '@/lib/voucher/redeem': { settleBookingVoucher: effect },
    '@/lib/voucher/fulfill': { fulfillVoucherByRef: effect }, '@/lib/promo/redeem': { settlePromoForBooking: effect },
  });
  const callback = moduleWithDeps('src/app/api/paysera/callback/route.ts', {
    '@/lib/booking/settle': settlement, '@/lib/booking/conflict': conflictModule,
    '@/lib/paysera': {
      verifyPayseraSignature: (_body, signature) => signature === 'test-signature',
      parsePayseraWebhook: JSON.parse, getPayseraOrderStatus: async () => 'paid', isPaidStatus: s => s === 'paid',
    },
  });
  const pay = (ref, signature = 'test-signature') => callback.POST(new Request('https://example.test/api/paysera/callback', {
    method: 'POST', headers: { 'x-paysera-signature': signature },
    body: JSON.stringify({ merchantReference: ref, paid: true, orderId: 'test-order' }),
  }));
  await reset();
  await insert(db, fixture('callback-late'));
  await age('callback-late');
  await insert(db, fixture('callback-winner'));
  assert.equal((await pay('callback-late')).status, 409);
  assert.equal((await pay('callback-late')).status, 409);
  assert.equal(effects, 0);
  assert.equal((await pay('callback-winner', 'invalid')).status, 401);
  assert.equal(effects, 0);
  assert.equal((await pay('callback-winner')).status, 200);
  assert.equal((await pay('callback-winner')).status, 200);
  assert.equal((await db.query("select count(*)::int as n from bookings where status='paid'")).rows[0].n, 1);
  pass('real callback handler: conflict 409 without downstream effects, invalid signature 401, duplicate success 200');
  console.log(`SUCCESS: ${passed} groups; real PostgreSQL, no production DB or payments.`);
} finally {
  await Promise.allSettled(connections.map(c => c.end()));
  try {
    await root.query(`drop database if exists ${dbName} with (force)`);
  } finally {
    await root.end();
  }
}
