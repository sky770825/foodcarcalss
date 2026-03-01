/**
 * 自動刪除 foodcarcalss 重複預約（同場地+同日期+同餐車只保留一筆，保留 id 最大）
 * 使用方式：node remove_duplicate_bookings.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function key(row) {
  return [row.location || '', row.booking_date || '', row.vendor || ''].join('\t');
}

async function main() {
  console.log('正在讀取 foodcarcalss 全部資料...');
  const { data: rows, error: fetchError } = await supabase
    .from('foodcarcalss')
    .select('id, location, booking_date, vendor')
    .order('id', { ascending: true });

  if (fetchError) {
    console.error('讀取失敗:', fetchError.message);
    process.exit(1);
  }

  const byKey = new Map();
  for (const row of rows || []) {
    const k = key(row);
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k).push(row);
  }

  const toDelete = [];
  for (const [k, group] of byKey) {
    if (group.length <= 1) continue;
    const sorted = [...group].sort((a, b) => (b.id || 0) - (a.id || 0));
    for (let i = 1; i < sorted.length; i++) toDelete.push(sorted[i].id);
  }

  if (toDelete.length === 0) {
    console.log('沒有重複預約，無需刪除。');
    return;
  }

  console.log('找到重複筆數:', toDelete.length, '筆，正在刪除...');
  for (const id of toDelete) {
    const { error: delError } = await supabase.from('foodcarcalss').delete().eq('id', id);
    if (delError) {
      console.error('刪除 id=' + id + ' 失敗:', delError.message);
    }
  }
  console.log('已刪除', toDelete.length, '筆重複預約。');
  console.log('請至 Supabase → SQL Editor 執行 add_unique_booking_constraint.sql 以加上唯一約束，防止之後再產生重複。');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
