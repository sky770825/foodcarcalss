// Google Sheets 資料遷移到 Supabase 腳本
// 使用方法：在 Node.js 環境中執行此腳本

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

// ========== 配置區域 ==========
// 請填入您的 Supabase 專案資訊
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';
const GOOGLE_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbxl0lUEzPoa2bjAm_X0KPXi_ZDIUB5BHbIjF912-lofb2mj7caelPU7fhQODi6D4T_4/exec';

// ========== 初始化 Supabase 客戶端 ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ========== 從 Google Sheets 獲取資料 ==========
async function fetchGoogleSheetsData() {
  return new Promise((resolve, reject) => {
    const url = `${GOOGLE_SHEETS_API_URL}?action=getBookings`;
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          if (jsonData.success && jsonData.bookings) {
            resolve(jsonData.bookings);
          } else {
            reject(new Error('無法從 Google Sheets 獲取資料'));
          }
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// ========== 轉換資料格式 ==========
function transformBookingData(booking) {
  return {
    timestamp: booking.timestamp || new Date().toISOString(),
    vendor: booking.vendor || '',
    food_type: booking.foodType || '',
    location: booking.location || '',
    booking_date: booking.date || '',
    status: booking.status || booking.bookedStatus || '己排',
    fee: booking.fee || '600元/天',
    payment: booking.payment || '未繳款',
    note: booking.note || ''
  };
}

// ========== 遷移資料到 Supabase ==========
async function migrateToSupabase() {
  try {
    console.log('🚀 開始遷移資料...');
    
    // 1. 從 Google Sheets 獲取資料
    console.log('📥 從 Google Sheets 獲取資料...');
    const bookings = await fetchGoogleSheetsData();
    console.log(`✅ 成功獲取 ${bookings.length} 筆預約資料`);
    
    // 2. 轉換資料格式
    console.log('🔄 轉換資料格式...');
    const transformedBookings = bookings.map(transformBookingData);
    
    // 3. 批次插入到 Supabase（每批 100 筆）
    console.log('📤 開始插入資料到 Supabase...');
    const batchSize = 100;
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < transformedBookings.length; i += batchSize) {
      const batch = transformedBookings.slice(i, i + batchSize);
      
      const { data, error } = await supabase
        .from('foodcarcalss')
        .insert(batch);
      
      if (error) {
        console.error(`❌ 批次 ${Math.floor(i / batchSize) + 1} 插入失敗:`, error);
        errorCount += batch.length;
      } else {
        console.log(`✅ 批次 ${Math.floor(i / batchSize) + 1} 插入成功 (${batch.length} 筆)`);
        successCount += batch.length;
      }
    }
    
    console.log('\n📊 遷移結果：');
    console.log(`✅ 成功: ${successCount} 筆`);
    console.log(`❌ 失敗: ${errorCount} 筆`);
    console.log(`📝 總計: ${bookings.length} 筆`);
    
    if (errorCount === 0) {
      console.log('\n🎉 資料遷移完成！');
    } else {
      console.log('\n⚠️  部分資料遷移失敗，請檢查錯誤訊息');
    }
    
  } catch (error) {
    console.error('❌ 遷移過程發生錯誤:', error);
    process.exit(1);
  }
}

// ========== 執行遷移 ==========
if (require.main === module) {
  migrateToSupabase();
}

module.exports = { migrateToSupabase, fetchGoogleSheetsData, transformBookingData };
