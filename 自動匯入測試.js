// 自動化測試：從 Google Sheets 匯入資料到 Supabase
// 執行方式：node 自動匯入測試.js

const { createClient } = require('@supabase/supabase-js');

// ========== 配置 ==========
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

// Google Apps Script Web App URL
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxl0lUEzPoa2bjAm_X0KPXi_ZDIUB5BHbIjF912-lofb2mj7caelPU7fhQODi6D4T_4/exec';

// ========== 初始化 Supabase ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 輔助函數 ==========

// 格式化時間戳記
function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

// 從 Google Sheets 獲取資料
async function fetchFromGoogleSheets() {
  console.log('📥 正在從 Google Sheets 讀取資料...');
  
  try {
    const url = `${GOOGLE_SHEETS_API_URL}?action=getBookings&_t=${Date.now()}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (result.success && result.bookings) {
      console.log(`✅ 成功從 Google Sheets 獲取 ${result.bookings.length} 筆資料`);
      return result.bookings;
    } else {
      throw new Error('Google Sheets 回應格式異常: ' + JSON.stringify(result));
    }
  } catch (error) {
    console.error('❌ 從 Google Sheets 讀取失敗:', error.message);
    throw error;
  }
}

// 檢查 Supabase 中是否已存在該記錄
async function checkExistingBooking(booking) {
  // 使用 location + booking_date + vendor 作為唯一標識
  const { data, error } = await supabase
    .from('foodcarcalss')
    .select('id')
    .eq('location', booking.location)
    .eq('booking_date', booking.date)
    .eq('vendor', booking.vendor)
    .limit(1);
  
  if (error) {
    console.warn('檢查重複記錄時出錯:', error.message);
    return null;
  }
  
  return data && data.length > 0 ? data[0].id : null;
}

// 轉換資料格式並寫入 Supabase
async function importToSupabase(bookings) {
  console.log('📤 正在匯入資料到 Supabase...');
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  const errors = [];
  
  for (let i = 0; i < bookings.length; i++) {
    const booking = bookings[i];
    
    try {
      // 檢查必填欄位
      if (!booking.vendor || !booking.location || !booking.date) {
        console.warn(`⚠️  跳過第 ${i + 1} 筆（缺少必填欄位）:`, {
          vendor: booking.vendor || '(空)',
          location: booking.location || '(空)',
          date: booking.date || '(空)'
        });
        skipCount++;
        continue;
      }
      
      // 檢查是否已存在
      const existingId = await checkExistingBooking(booking);
      if (existingId) {
        console.log(`⏭️  跳過第 ${i + 1} 筆（已存在）: ${booking.vendor} - ${booking.location} - ${booking.date} (ID: ${existingId})`);
        skipCount++;
        continue;
      }
      
      // 準備資料
      const supabaseData = {
        timestamp: booking.timestamp || new Date().toISOString(),
        vendor: booking.vendor,
        food_type: booking.foodType || '',
        location: booking.location,
        booking_date: booking.date, // 保持原有格式（例如：10月13日(星期一)）
        status: booking.status || booking.bookedStatus || '己排',
        fee: booking.fee || '600元/天',
        payment: booking.payment || '未繳款',
        note: booking.note || ''
      };
      
      // 插入資料
      const { data, error } = await supabase
        .from('foodcarcalss')
        .insert(supabaseData)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      successCount++;
      if ((i + 1) % 10 === 0) {
        console.log(`  📊 進度: ${i + 1}/${bookings.length} (成功: ${successCount}, 跳過: ${skipCount}, 錯誤: ${errorCount})`);
      }
      
    } catch (error) {
      errorCount++;
      const errorMsg = `第 ${i + 1} 筆資料匯入失敗: ${error.message}`;
      errors.push({
        index: i + 1,
        booking: booking,
        error: error.message
      });
      console.error(`❌ ${errorMsg}`);
    }
  }
  
  return {
    total: bookings.length,
    success: successCount,
    skip: skipCount,
    error: errorCount,
    errors: errors
  };
}

// 主函數
async function main() {
  console.log('========================================');
  console.log('🚀 開始自動匯入測試');
  console.log('========================================');
  console.log('');
  
  try {
    // 1. 從 Google Sheets 讀取資料
    const bookings = await fetchFromGoogleSheets();
    
    if (!bookings || bookings.length === 0) {
      console.log('⚠️  Google Sheets 中沒有資料');
      return;
    }
    
    console.log('');
    console.log('📋 資料樣本（前3筆）:');
    bookings.slice(0, 3).forEach((b, i) => {
      console.log(`  ${i + 1}. ${b.vendor || '(無)'} | ${b.location || '(無)'} | ${b.date || '(無)'}`);
    });
    console.log('');
    
    // 2. 匯入到 Supabase
    const result = await importToSupabase(bookings);
    
    // 3. 顯示結果
    console.log('');
    console.log('========================================');
    console.log('✅ 匯入完成！');
    console.log('========================================');
    console.log(`📊 總計: ${result.total} 筆`);
    console.log(`✅ 成功: ${result.success} 筆`);
    console.log(`⏭️  跳過: ${result.skip} 筆（已存在）`);
    console.log(`❌ 錯誤: ${result.error} 筆`);
    console.log('');
    
    if (result.errors.length > 0) {
      console.log('❌ 錯誤詳情:');
      result.errors.forEach(err => {
        console.log(`  - 第 ${err.index} 筆: ${err.error}`);
      });
      console.log('');
    }
    
    // 4. 驗證：查詢 Supabase 中的總記錄數
    const { count, error: countError } = await supabase
      .from('foodcarcalss')
      .select('*', { count: 'exact', head: true });
    
    if (!countError) {
      console.log(`📈 Supabase 中目前總共有 ${count} 筆記錄`);
    }
    
    console.log('========================================');
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ 匯入過程發生錯誤');
    console.error('========================================');
    console.error('錯誤訊息:', error.message);
    console.error('錯誤堆疊:', error.stack);
    console.error('========================================');
    process.exit(1);
  }
}

// 執行
main();
