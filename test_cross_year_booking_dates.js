/**
 * Regression test for December-to-January booking dates.
 * Run with: node test_cross_year_booking_dates.js
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('script.js', 'utf8');
const adminSource = fs.readFileSync('admin.js', 'utf8');
const formatterStart = source.indexOf('function formatBookingDateForDisplay(dateStr)');
const formatterEnd = source.indexOf('function getBookingLocationConflictVariants', formatterStart);
const submitStart = source.indexOf('async function submitToGoogleSheets(formData)');
const submitEnd = source.indexOf('// 將資料庫的日期欄位統一轉為本地 YYYY-MM-DD。', submitStart);
const helperStart = source.indexOf('function resolveBookingDateToISO(booking, referenceDate = new Date())');
const helperEnd = source.indexOf('// 從 Supabase 讀取所有預約數據', helperStart);
const fetchStart = source.indexOf('async function fetchBookedDatesFromSheets()');
const fetchEnd = source.indexOf('// 暴露到全局', fetchStart);
const adminParseStart = adminSource.indexOf('function parseDate(dateStr, sourceTimestamp)');
const adminParseEnd = adminSource.indexOf('function formatDateInputValue', adminParseStart);

assert(formatterStart >= 0 && formatterEnd > formatterStart, 'Unable to locate booking-date formatter');
assert(submitStart >= 0 && submitEnd > submitStart, 'Unable to locate booking submission flow');
assert(helperStart >= 0 && helperEnd > helperStart, 'Unable to locate cross-year date resolver');
assert(fetchStart >= 0 && fetchEnd > fetchStart, 'Unable to locate booked-date synchronizer');
assert(adminParseStart >= 0 && adminParseEnd > adminParseStart, 'Unable to locate admin date parser');

const selectedColumns = [];
const sampleBookings = [
  {
    location: '四維路59號',
    booking_date: '1月5日(星期一)',
    payment: '尚未付款',
    timestamp: '2026-12-15T12:00:00+08:00'
  },
  {
    location: '四維路59號',
    booking_date: '2027-01-06',
    payment: '己繳款',
    created_at: '2026-12-16T12:00:00+08:00'
  }
];

const context = vm.createContext({
  console,
  Date,
  SUPABASE_CONFIG: { enabled: true },
  formatTimestamp: () => '2026-12-15T04:00:00Z',
  supabaseClient: {
    from(table) {
      assert.equal(table, 'foodcarcalss');
      return {
        select(columns) {
          selectedColumns.push(columns);
          return Promise.resolve({ data: sampleBookings, error: null });
        }
      };
    }
  }
});

vm.runInContext(`${source.slice(helperStart, helperEnd)}\n${source.slice(fetchStart, fetchEnd)}`, context);

const formatterContext = vm.createContext({ console, Date });
vm.runInContext(source.slice(formatterStart, formatterEnd), formatterContext);

const adminContext = vm.createContext({ Date });
vm.runInContext(adminSource.slice(adminParseStart, adminParseEnd), adminContext);

const conflictChecks = [];
const insertedBookings = [];
const submissionContext = vm.createContext({
  console,
  Date,
  SUPABASE_CONFIG: { enabled: true },
  locationConfigs: {},
  supabaseClient: {
    from(table) {
      assert.equal(table, 'foodcarcalss');
      const conflictQuery = {
        in(column, values) {
          conflictChecks.push([column, values]);
          return conflictQuery;
        },
        eq(column, value) {
          conflictChecks.push([column, value]);
          return conflictQuery;
        },
        limit() {
          return Promise.resolve({ data: [], error: null });
        }
      };
      return {
        select() {
          return conflictQuery;
        },
        insert(values) {
          insertedBookings.push(values);
          return {
            select() {
              return {
                async single() {
                  return { data: { id: 99, ...values }, error: null };
                }
              };
            }
          };
        }
      };
    }
  }
});
vm.runInContext(`${source.slice(formatterStart, submitEnd)}`, submissionContext);

async function run() {
  assert.equal(
    context.resolveBookingDateToISO({ booking_date: '1月5日', timestamp: '2026-12-15T12:00:00+08:00' }),
    '2027-01-05'
  );
  assert.equal(
    context.resolveBookingDateToISO({ booking_date: '12月31日', timestamp: '2026-12-15T12:00:00+08:00' }),
    '2026-12-31'
  );
  assert.equal(
    context.resolveBookingDateToISO({ booking_date: '1月5日' }, new Date(2026, 11, 15)),
    '2027-01-05'
  );
  assert.equal(
    context.resolveBookingDateToISO({ booking_date: '2027年1月5日(星期一)' }),
    '2027-01-05'
  );
  assert.equal(
    formatterContext.formatBookingDateForDisplay('2027-01-05'),
    '2027年1月5日(星期二)'
  );

  const parsedAdminDate = adminContext.parseDate('2027年1月5日(星期一)');
  assert.equal(parsedAdminDate.getFullYear(), 2027);
  assert.equal(parsedAdminDate.getMonth(), 0);
  assert.equal(parsedAdminDate.getDate(), 5);

  const legacyJanuary = adminContext.parseDate('1月5日(星期一)', '2026-01-02T12:00:00+08:00');
  assert.equal(legacyJanuary.getFullYear(), 2026);
  assert.equal(legacyJanuary.getMonth(), 0);

  const nextYearJanuary = adminContext.parseDate('1月5日(星期一)', '2026-12-15T12:00:00+08:00');
  assert.equal(nextYearJanuary.getFullYear(), 2027);
  assert.equal(nextYearJanuary.getMonth(), 0);

  const submission = await submissionContext.submitToGoogleSheets({
    vendor: '跨年測試餐車',
    foodType: '主食類',
    location: '四維路59號',
    date: '2027-01-05',
    timestamp: '2026-12-15T12:00:00+08:00'
  });
  assert.equal(submission.success, true);
  assert.deepEqual(JSON.parse(JSON.stringify(conflictChecks.at(-1))), [
    'booking_date',
    '2027年1月5日(星期二)'
  ]);
  assert.equal(insertedBookings[0].booking_date, '2027年1月5日(星期二)');

  const bookedDates = await context.fetchBookedDatesFromSheets();
  assert.match(selectedColumns[0], /timestamp/);
  assert.match(selectedColumns[0], /created_at/);
  assert.deepEqual(JSON.parse(JSON.stringify(bookedDates['四維路59號'])), [
    { standardDate: '2027-01-05', date: '1月5日(星期一)', payment: '尚未付款' },
    { standardDate: '2027-01-06', date: '2027-01-06', payment: '己繳款' }
  ]);

  console.log('跨年 1 月已占用日期測試通過。');
}

run().catch(error => {
  console.error(error);
  process.exit(1);
});
