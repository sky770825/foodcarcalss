/**
 * Regression test for 四維路30號 new-booking availability.
 * Run with: node test_siwei_30_booking_days.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const configStart = source.indexOf('// 多場地規則配置');
const configEnd = source.indexOf('// 已預約的日期和時段', configStart);
assert(configStart >= 0 && configEnd > configStart, 'Unable to locate locationConfigs');

const context = vm.createContext({});
vm.runInContext(`${source.slice(configStart, configEnd)}\nglobalThis.__locationConfigs = locationConfigs;`, context);

const siwei30 = context.__locationConfigs['開心果團購'];
assert.deepEqual(
  JSON.parse(JSON.stringify(siwei30.days)),
  [0, 1, 2],
  '四維路30號只應開放週日、週一、週二的新報班'
);

console.log('四維路30號開放日規則測試通過。');
