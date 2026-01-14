// 最終完整測試：圖片上傳功能
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function finalTest() {
  console.log('🎯 最終完整測試：圖片上傳功能\n');
  
  let allTestsPassed = true;
  
  // 測試圖片（1x1 PNG）
  const testImage = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  
  // 測試 1: 上傳到正確的目錄結構
  console.log('1️⃣ 測試上傳到正確目錄結構...');
  const timestamp = Date.now();
  const testVendor = '測試餐車';
  const testLocation = '四維路59號';
  const testDate = '20250125';
  
  // 使用與前端相同的文件名生成邏輯
  function sanitizeForPath(str) {
    if (!str) return 'unknown';
    // 簡單的場地名稱映射
    const locationMap = {
      '四維路59號': 'siwei_59',
      '四維路60號': 'siwei_60',
      '漢堡大亨': 'hamburger',
      '自由風': 'ziyoufeng',
      '蔬蒔': 'shushi',
      '金正好吃': 'jinzhenghaochi'
    };
    
    if (locationMap[str]) {
      return locationMap[str];
    }
    
    // 否則，保留字母、數字、下劃線和連字號
    let sanitized = str.replace(/[^a-zA-Z0-9\-_]/g, '_');
    sanitized = sanitized.replace(/_+/g, '_');
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    return sanitized || 'unknown';
  }
  
  const sanitizedVendor = sanitizeForPath(testVendor);
  const sanitizedLocation = sanitizeForPath(testLocation);
  const sanitizedDate = testDate.replace(/-/g, '');
  const fileName = `payment_images/${sanitizedLocation}/${sanitizedDate}_${sanitizedVendor}_${timestamp}.png`;
  
  console.log('   - 目標路徑:', fileName);
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('foodcarcalss')
    .upload(fileName, testImage, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error('   ❌ 上傳失敗:', uploadError.message);
    allTestsPassed = false;
  } else {
    console.log('   ✅ 上傳成功');
    console.log('      - 路徑:', uploadData.path);
  }
  
  // 測試 2: 獲取公開 URL
  console.log('\n2️⃣ 測試獲取公開 URL...');
  const { data: urlData } = supabase.storage
    .from('foodcarcalss')
    .getPublicUrl(fileName);
  
  if (!urlData || !urlData.publicUrl) {
    console.error('   ❌ 無法獲取公開 URL');
    allTestsPassed = false;
  } else {
    console.log('   ✅ 公開 URL 獲取成功');
    console.log('      - URL:', urlData.publicUrl);
  }
  
  // 測試 3: 更新資料庫記錄
  console.log('\n3️⃣ 測試更新資料庫記錄...');
  const { data: testBooking, error: insertError } = await supabase
    .from('foodcarcalss')
    .insert({
      vendor: '測試餐車_圖片上傳',
      food_type: '測試類型',
      location: testLocation,
      booking_date: '1月25日(星期六)',
      status: '己排',
      fee: '600元/天',
      payment: '尚未付款',
      payment_image_url: urlData?.publicUrl || null
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('   ❌ 創建測試記錄失敗:', insertError.message);
    allTestsPassed = false;
  } else {
    console.log('   ✅ 測試記錄創建成功');
    console.log('      - ID:', testBooking.id);
    console.log('      - 圖片 URL:', testBooking.payment_image_url);
    
    // 驗證圖片 URL 是否正確保存
    if (testBooking.payment_image_url === urlData?.publicUrl) {
      console.log('   ✅ 圖片 URL 已正確保存到資料庫');
    } else {
      console.error('   ❌ 圖片 URL 保存不正確');
      allTestsPassed = false;
    }
    
    // 清理測試記錄
    await supabase.from('foodcarcalss').delete().eq('id', testBooking.id);
    console.log('   ✅ 測試記錄已清理');
  }
  
  // 清理測試圖片
  if (uploadData) {
    console.log('\n4️⃣ 清理測試圖片...');
    const { error: deleteError } = await supabase.storage
      .from('foodcarcalss')
      .remove([fileName]);
    
    if (deleteError) {
      console.warn('   ⚠️ 清理失敗（可手動刪除）:', deleteError.message);
    } else {
      console.log('   ✅ 測試圖片已清理');
    }
  }
  
  // 最終結果
  console.log('\n' + '='.repeat(50));
  if (allTestsPassed) {
    console.log('🎉 所有測試通過！圖片上傳功能完全正常！');
    console.log('\n✅ 功能確認：');
    console.log('   - 圖片可以上傳到 Supabase Storage');
    console.log('   - 可以獲取公開 URL');
    console.log('   - 可以保存 URL 到資料庫');
    console.log('   - 目錄結構正確（payment_images/場地/文件名）');
    console.log('\n🚀 現在可以在前端使用圖片上傳功能了！');
  } else {
    console.log('❌ 部分測試失敗，請檢查錯誤訊息');
  }
  console.log('='.repeat(50));
  
  return allTestsPassed;
}

finalTest()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  });
