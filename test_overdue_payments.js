/**
 * Regression test for the admin-side overdue transition.
 * Run with: node test_overdue_payments.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('admin.js', 'utf8');
const start = source.indexOf('// 判斷是否為未繳款狀態');
const end = source.indexOf('// 載入預約數據');
assert(start >= 0 && end > start, 'Unable to locate payment status helpers in admin.js');

const updates = [];
const supabaseClientInstance = {
  from(table) {
    assert.equal(table, 'foodcarcalss');
    return {
      update(values) {
        return {
          async in(column, ids) {
            updates.push({ column, ids, values });
            return { error: null };
          }
        };
      }
    };
  }
};

const context = vm.createContext({
  console,
  Date,
  supabaseClientInstance
});
vm.runInContext(source.slice(start, end), context);

async function run() {
  const now = Date.now();
  const stale = new Date(now - 25 * 60 * 60 * 1000).toISOString();
  const fresh = new Date(now - 60 * 60 * 1000).toISOString();
  const bookings = [
    { id: 1, payment: '尚未付款', timestamp: stale },
    { id: 2, payment: '未繳款', timestamp: stale },
    { id: 3, payment: '己繳款', timestamp: stale },
    { id: 4, payment: '逾繳可排', timestamp: stale },
    { id: 5, payment: '尚未付款', timestamp: fresh }
  ];

  const updatedCount = await context.autoUpdateOverduePayments(bookings);

  assert.equal(updatedCount, 1);
  assert.deepEqual(JSON.parse(JSON.stringify(updates)), [{ column: 'id', ids: [1], values: { payment: '逾繳可排' } }]);
  assert.equal(bookings[0].payment, '逾繳可排');
  assert.equal(bookings[1].payment, '未繳款');
  assert.equal(bookings[2].payment, '己繳款');
  assert.equal(bookings[3].payment, '逾繳可排');
  assert.equal(bookings[4].payment, '尚未付款');
  assert.equal(context.normalizePaymentStatusForDisplay('尚未付款'), '未繳款');
  assert.equal(context.normalizePaymentStatusForDisplay('逾繳可排'), '逾繳可排');

  console.log('Overdue payment regression test passed.');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
