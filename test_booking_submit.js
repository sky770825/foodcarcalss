/**
 * 測試報班 API：新增一筆測試預約後刪除，確認 Supabase 連線與寫入正常
 * 執行：node test_booking_submit.js
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 測試用：唯一名稱與日期，避免與真實資料衝突
const testDate = new Date();
const month = testDate.getMonth() + 1;
const day = testDate.getDate();
const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const dayName = dayNames[testDate.getDay()];
const bookingDateStr = `${month}月${day}日(${dayName})`;

const testBooking = {
  vendor: '測試報班_自動刪除_' + Date.now(),
  food_type: '測試',
  location: '四維路59號',
  booking_date: bookingDateStr,
  status: '己排',
  fee: '600元/天',
  payment: '尚未付款',
  note: '自動測試用，請忽略',
};

async function run() {
  console.log('1. 測試新增預約（先 upsert，失敗則 insert）...');
  let result = await supabase
    .from('foodcarcalss')
    .upsert(testBooking, { onConflict: 'location,booking_date,vendor', ignoreDuplicates: false })
    .select()
    .single();

  if (result.error && result.error.code === '42P10') {
    console.log('   資料庫無唯一約束，改為 insert');
    result = await supabase.from('foodcarcalss').insert(testBooking).select().single();
  }

  if (result.error) {
    console.error('❌ 新增失敗:', result.error.message);
    process.exit(1);
  }

  const id = result.data.id;
  console.log('   ✅ 新增成功, id:', id);

  console.log('2. 刪除測試筆...');
  const { error: delError } = await supabase.from('foodcarcalss').delete().eq('id', id);
  if (delError) {
    console.error('❌ 刪除失敗:', delError.message);
    process.exit(1);
  }
  console.log('   ✅ 已刪除');

  console.log('\n✅ 報班流程測試通過（Supabase 連線與寫入正常）');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
