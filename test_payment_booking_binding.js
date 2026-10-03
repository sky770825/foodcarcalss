const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const start = source.indexOf('function showPaymentModal(bookingEvent, dateStr)');
const end = source.indexOf('function closePaymentModal()', start);
assert(start >= 0 && end > start);
const storage = new Map();
const elements = new Map();
const context = vm.createContext({
  console,
  currentBookingInfo: null,
  currentBookingId: null,
  removePaymentModalImage() {},
  sessionStorage: {
    getItem: key => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value)
  },
  document: {
    body: { style: {} },
    getElementById(id) {
      if (!elements.has(id)) elements.set(id, { style: {}, classList: { add() {} } });
      return elements.get(id);
    }
  }
});
vm.runInContext(source.slice(start, end), context);

context.showPaymentModal({ rowNumber: 101, title: 'Brand A', location: 'Venue A', timestamp: '2026-10-03T00:00:00Z' }, '2026-11-01');
assert.equal(context.currentBookingId, 101);
assert.equal(JSON.parse(storage.get('currentBookingInfo')).vendor, 'Brand A');

context.showPaymentModal({ rowNumber: 202, title: 'Brand B', location: 'Venue B', timestamp: '2026-10-03T01:00:00Z' }, '2026-11-02');
assert.equal(context.currentBookingId, 202);
assert.equal(context.currentBookingInfo.vendor, 'Brand B');
assert.equal(context.currentBookingInfo.date, '2026-11-02');
assert.match(elements.get('paymentBookingDetails').textContent, /Brand B/);

context.currentBookingInfo = null;
context.currentBookingId = null;
context.showPaymentModal();
assert.equal(context.currentBookingId, 202);
assert.equal(context.currentBookingInfo.timestamp, '2026-10-03T01:00:00Z');
console.log('Payment modal booking binding regression passed.');
