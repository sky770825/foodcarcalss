/**
 * Regression test for the back-office schedule-change restriction.
 * Run with: node test_admin_location_day_rules.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('admin.js', 'utf8');
const rulesStart = source.indexOf('const locationNameMap = {');
const rulesEnd = source.indexOf('// 檢查場地名稱是否匹配', rulesStart);
assert(rulesStart >= 0 && rulesEnd > rulesStart, 'Unable to locate admin location day rules');

const context = vm.createContext({});
vm.runInContext(`${source.slice(rulesStart, rulesEnd)}\nglobalThis.__adminRules = { getAvailableDaysForLocation, getLocationOpenDayMessage, isDateAllowedForLocation };`, context);

const siwei30 = {
  location_key: '開心果團購',
  location_name: '開心果團購',
  available_days: [6, 0, 1]
};

assert.deepEqual(
  JSON.parse(JSON.stringify(context.__adminRules.getAvailableDaysForLocation(siwei30))),
  [6, 0, 1]
);
assert.equal(context.__adminRules.isDateAllowedForLocation(siwei30, '2026-10-03'), true);
assert.equal(context.__adminRules.isDateAllowedForLocation(siwei30, '2026-10-04'), true);
assert.equal(context.__adminRules.isDateAllowedForLocation(siwei30, '2026-10-05'), true);
assert.equal(context.__adminRules.isDateAllowedForLocation(siwei30, '2026-10-06'), false);
assert.equal(context.__adminRules.isDateAllowedForLocation(siwei30, '2026-10-09'), false);
assert.equal(
  context.__adminRules.getLocationOpenDayMessage(siwei30),
  '開心果團購僅開放週六、週日、週一報班'
);

console.log('後台四維路30號排班日期限制測試通過。');
