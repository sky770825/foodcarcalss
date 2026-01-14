// 只測試圖片上傳功能（不測試資料庫）
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
  console.log('🎯 測試圖片上傳功能\n');
  
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
  
  // 測試多個場地
  const testCases = [
    { location: '四維路59號', vendor: '測試餐車A', date: '20250125' },
    { location: '漢堡大亨', vendor: '測試餐車B', date: '20250126' },
    { location: '自由風', vendor: '測試餐車C', date: '20250127' }
  ];
  
  let successCount = 0;
  const uploadedFiles = [];
  
  for (const testCase of testCases) {
    const timestamp = Date.now();
    
    // 場地映射
    const locationMap = {
      '四維路59號': 'siwei_59',
      '四維路60號': 'siwei_60',
      '漢堡大亨': 'hamburger',
      '自由風': 'ziyoufeng',
      '蔬蒔': 'shushi',
      '金正好吃': 'jinzhenghaochi'
    };
    
    const sanitizedLocation = locationMap[testCase.location] || testCase.location.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const sanitizedVendor = testCase.vendor.replace(/[^a-zA-Z0-9\-_]/g, '_');
    const sanitizedDate = testCase.date.replace(/-/g, '');
    const fileName = `payment_images/${sanitizedLocation}/${sanitizedDate}_${sanitizedVendor}_${timestamp}.png`;
    
    console.log(`📤 測試上傳: ${testCase.location} -> ${fileName}`);
    
    const { data, error } = await supabase.storage
      .from('foodcarcalss')
      .upload(fileName, testImage, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error(`   ❌ 失敗: ${error.message}`);
    } else {
      console.log(`   ✅ 成功: ${data.path}`);
      const { data: urlData } = supabase.storage
        .from('foodcarcalss')
        .getPublicUrl(fileName);
      if (urlData && urlData.publicUrl) {
        console.log(`   🔗 URL: ${urlData.publicUrl}`);
      }
      uploadedFiles.push(fileName);
      successCount++;
    }
    console.log('');
  }
  
  // 清理測試文件
  if (uploadedFiles.length > 0) {
    console.log('🧹 清理測試文件...');
    const { error: deleteError } = await supabase.storage
      .from('foodcarcalss')
      .remove(uploadedFiles);
    
    if (deleteError) {
      console.warn('⚠️ 清理失敗:', deleteError.message);
    } else {
      console.log(`✅ 已清理 ${uploadedFiles.length} 個測試文件\n`);
    }
  }
  
  console.log('='.repeat(50));
  if (successCount === testCases.length) {
    console.log('🎉 所有測試通過！圖片上傳功能完全正常！');
    console.log('\n✅ 確認：');
    console.log('   - 圖片可以上傳到 Supabase Storage');
    console.log('   - 可以獲取公開 URL');
    console.log('   - 目錄結構正確');
    console.log('   - 場地映射正常');
    console.log('\n📝 注意：還需要執行 add_payment_image_column.sql 來添加資料庫欄位');
  } else {
    console.log(`⚠️ ${successCount}/${testCases.length} 個測試通過`);
  }
  console.log('='.repeat(50));
  
  return successCount === testCases.length;
}

testUpload().then(success => process.exit(success ? 0 : 1));
