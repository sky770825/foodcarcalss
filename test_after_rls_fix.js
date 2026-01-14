// 測試 RLS 政策設置後的圖片上傳
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testUpload() {
  console.log('🧪 測試圖片上傳（RLS 政策設置後）...\n');
  
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
  
  const fileName = `payment_images/測試場地/test_${Date.now()}.png`;
  
  console.log('📤 上傳測試圖片...');
  const { data, error } = await supabase.storage
    .from('foodcarcalss')
    .upload(fileName, testImage, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('❌ 上傳失敗:', error.message);
    return false;
  }
  
  console.log('✅ 上傳成功！');
  console.log('   - 路徑:', data.path);
  
  const { data: urlData } = supabase.storage
    .from('foodcarcalss')
    .getPublicUrl(fileName);
  
  if (urlData && urlData.publicUrl) {
    console.log('✅ 公開 URL:', urlData.publicUrl);
  }
  
  // 清理
  await supabase.storage.from('foodcarcalss').remove([fileName]);
  console.log('✅ 測試完成，文件已清理\n');
  
  console.log('🎉 圖片上傳功能正常！');
  return true;
}

testUpload().then(success => process.exit(success ? 0 : 1));
