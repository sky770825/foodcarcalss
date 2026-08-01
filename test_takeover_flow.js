/**
 * Regression test for the public overdue-booking takeover flow.
 * A successful takeover must create a fresh 24-hour payment window.
 * Run with: node test_takeover_flow.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('async function submitToGoogleSheets(formData)');
const end = source.indexOf('// 從 Supabase 讀取所有預約數據', start);
assert(start >= 0 && end > start, 'Unable to locate submitToGoogleSheets in script.js');

const updates = [];
const conditions = [];
const takeoverTimestamp = '2026-08-02T01:23:45Z';

const supabaseClient = {
  from(table) {
    assert.equal(table, 'foodcarcalss');
    const query = {
      select() {
        return query;
      },
      update(values) {
        updates.push(values);
        return query;
      },
      eq(column, value) {
        conditions.push([column, value]);
        return query;
      },
      async single() {
        if (updates.length === 0) {
          return { data: { payment: '逾繳可排' }, error: null };
        }
        return { data: { id: 42, ...updates.at(-1) }, error: null };
      },
      async maybeSingle() {
        return { data: { id: 42, ...updates.at(-1) }, error: null };
      }
    };
    return query;
  }
};

const context = vm.createContext({
  console,
  SUPABASE_CONFIG: { enabled: true },
  supabaseClient
});
vm.runInContext(source.slice(start, end), context);

async function run() {
  const result = await context.submitToGoogleSheets({
    action: 'takeover',
    rowNumber: 42,
    vendor: '接手測試餐車',
    foodType: '主食類',
    timestamp: takeoverTimestamp
  });

  assert.equal(result.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(updates)), [{
    vendor: '接手測試餐車',
    food_type: '主食類',
    payment: '尚未付款',
    timestamp: takeoverTimestamp
  }]);
  assert.deepEqual(JSON.parse(JSON.stringify(conditions)), [
    ['id', 42],
    ['payment', '逾繳可排']
  ]);
  assert.equal(result.booking.payment, '尚未付款');
  assert.equal(result.booking.timestamp, takeoverTimestamp);

  console.log('Takeover flow regression test passed.');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
