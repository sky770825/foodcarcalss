// 自動化測試：圖片上傳功能
// 使用方式：node test_image_upload.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase 配置
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

// 初始化 Supabase 客戶端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 創建測試圖片（1x1 像素的 PNG）
function createTestImage() {
  // 創建一個簡單的測試圖片文件
  const testImagePath = path.join(__dirname, 'test_image.png');
  
  // 如果文件不存在，創建一個最小的 PNG 圖片
  if (!fs.existsSync(testImagePath)) {
    // 最小的有效 PNG 圖片（1x1 像素，透明）
    const pngBuffer = Buffer.from([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixels
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
      0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
      0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
      0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, // IEND
      0xAE, 0x42, 0x60, 0x82
    ]);
    
    fs.writeFileSync(testImagePath, pngBuffer);
    console.log('✅ 已創建測試圖片:', testImagePath);
  }
  
  return testImagePath;
}

// 測試圖片上傳
async function testImageUpload() {
  console.log('🧪 開始測試圖片上傳功能...\n');
  
  try {
    // 1. 檢查 Supabase 連接
    console.log('1️⃣ 檢查 Supabase 連接...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('foodcarcalss')
      .select('id')
      .limit(1);
    
    if (healthError) {
      console.error('❌ Supabase 連接失敗:', healthError.message);
      return false;
    }
    console.log('✅ Supabase 連接正常\n');
    
    // 2. 檢查 Storage bucket 是否存在
    console.log('2️⃣ 檢查 Storage bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ 無法列出 buckets:', bucketsError.message);
      return false;
    }
    
    console.log('📋 所有可用的 buckets:');
    buckets.forEach(b => {
      console.log(`   - ${b.name} (公開: ${b.public ? '是' : '否'})`);
    });
    console.log('');
    
    const foodcarcalssBucket = buckets.find(b => b.name === 'foodcarcalss');
    if (!foodcarcalssBucket) {
      // 檢查是否有類似的名稱（大小寫不同）
      const similarBuckets = buckets.filter(b => 
        b.name.toLowerCase() === 'foodcarcalss' || 
        b.name.includes('foodcar') || 
        b.name.includes('payment')
      );
      
      if (similarBuckets.length > 0) {
        console.warn('⚠️ 找到類似的 bucket:');
        similarBuckets.forEach(b => {
          console.log(`   - ${b.name} (公開: ${b.public ? '是' : '否'})`);
        });
        console.log('\n💡 請確認 bucket 名稱是否為 "foodcarcalss"（完全一致）');
      } else {
        console.error('❌ 找不到 foodcarcalss bucket');
        console.log('\n💡 請按照 STORAGE_SETUP_GUIDE.md 的說明創建 bucket');
      }
      return false;
    }
    
    console.log('✅ 找到 foodcarcalss bucket');
    console.log('   - 名稱:', foodcarcalssBucket.name);
    console.log('   - 公開:', foodcarcalssBucket.public ? '是' : '否');
    console.log('   - 文件大小限制:', foodcarcalssBucket.file_size_limit || '無限制');
    console.log('   - 允許的 MIME 類型:', foodcarcalssBucket.allowed_mime_types?.join(', ') || '全部\n');
    
    // 3. 創建測試圖片
    console.log('3️⃣ 創建測試圖片...');
    const testImagePath = createTestImage();
    const testImageBuffer = fs.readFileSync(testImagePath);
    const fileSize = testImageBuffer.length;
    console.log('✅ 測試圖片已準備');
    console.log('   - 路徑:', testImagePath);
    console.log('   - 大小:', fileSize, 'bytes\n');
    
    // 4. 測試上傳圖片
    console.log('4️⃣ 測試上傳圖片到 Storage...');
    const timestamp = Date.now();
    const testVendor = '測試餐車';
    const testLocation = '四維路59號';
    const testDate = '20250125';
    
    const sanitizedVendor = testVendor.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const sanitizedLocation = testLocation.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_');
    const sanitizedDate = testDate.replace(/-/g, '');
    const fileName = `payment_images/${sanitizedLocation}/${sanitizedDate}_${sanitizedVendor}_${timestamp}.png`;
    
    console.log('   - 目標路徑:', fileName);
    
    // 上傳文件（直接使用 Buffer）
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('foodcarcalss')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('❌ 圖片上傳失敗:', uploadError.message);
      console.error('   錯誤代碼:', uploadError.statusCode || uploadError.status);
      console.error('   錯誤詳情:', JSON.stringify(uploadError, null, 2));
      
      // 檢查常見錯誤
      if (uploadError.message && uploadError.message.includes('Bucket not found')) {
        console.log('\n💡 解決方案: bucket 不存在或名稱不正確');
        console.log('   請確認 bucket 名稱是否為 "foodcarcalss"（完全一致，小寫）');
      } else if (uploadError.message && uploadError.message.includes('row-level security') || 
                 uploadError.message && uploadError.message.includes('RLS')) {
        console.log('\n💡 解決方案: RLS 政策未設置');
        console.log('   請在 Supabase Dashboard > Storage > Policies 中設置允許公開上傳的政策');
        console.log('   執行 setup_storage_bucket.sql 中的 RLS 政策 SQL');
      } else if (uploadError.message && uploadError.message.includes('already exists')) {
        console.log('\n💡 文件已存在，嘗試使用不同的文件名...');
        // 使用新的時間戳重試
        const newTimestamp = Date.now();
        const newFileName = `payment_images/${sanitizedLocation}/${sanitizedDate}_${sanitizedVendor}_${newTimestamp}.png`;
        console.log('   新文件名:', newFileName);
        
        const { data: retryData, error: retryError } = await supabase.storage
          .from('foodcarcalss')
          .upload(newFileName, testImageBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
            upsert: false
          });
        
        if (retryError) {
          console.error('❌ 重試上傳也失敗:', retryError.message);
          return false;
        }
        
        console.log('✅ 使用新文件名上傳成功');
        const { data: urlData } = supabase.storage
          .from('foodcarcalss')
          .getPublicUrl(newFileName);
        
        if (!urlData || !urlData.publicUrl) {
          console.error('❌ 無法獲取公開 URL');
          return false;
        }
        
        console.log('✅ 公開 URL:', urlData.publicUrl);
        // 繼續後續測試...
        uploadData = retryData;
      } else {
        console.log('\n💡 請檢查：');
        console.log('   1. Bucket 是否設置為公開（Public bucket: ✅）');
        console.log('   2. RLS 政策是否正確設置');
        console.log('   3. 文件大小是否超過限制');
        console.log('   4. MIME 類型是否允許');
      }
      
      if (!uploadError.message || !uploadError.message.includes('already exists')) {
        return false;
      }
    }
    
    console.log('✅ 圖片上傳成功');
    console.log('   - 路徑:', uploadData.path);
    console.log('   - ID:', uploadData.id);
    
    // 5. 測試獲取公開 URL
    console.log('\n5️⃣ 測試獲取公開 URL...');
    const { data: urlData } = supabase.storage
      .from('foodcarcalss')
      .getPublicUrl(fileName);
    
    if (!urlData || !urlData.publicUrl) {
      console.error('❌ 無法獲取公開 URL');
      return false;
    }
    
    console.log('✅ 公開 URL 獲取成功');
    console.log('   - URL:', urlData.publicUrl);
    
    // 6. 測試 URL 是否可訪問
    console.log('\n6️⃣ 測試 URL 可訪問性...');
    try {
      const fetch = require('node-fetch');
      const response = await fetch(urlData.publicUrl);
      if (response.ok) {
        console.log('✅ URL 可正常訪問');
        console.log('   - 狀態碼:', response.status);
        console.log('   - 內容類型:', response.headers.get('content-type'));
      } else {
        console.warn('⚠️ URL 無法訪問，狀態碼:', response.status);
      }
    } catch (fetchError) {
      console.warn('⚠️ 無法測試 URL 可訪問性（可能需要安裝 node-fetch）:', fetchError.message);
    }
    
    // 7. 測試更新資料庫
    console.log('\n7️⃣ 測試更新資料庫記錄...');
    
    // 先創建一個測試預約記錄
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
        payment_image_url: urlData.publicUrl
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('❌ 創建測試記錄失敗:', insertError.message);
      return false;
    }
    
    console.log('✅ 測試記錄創建成功');
    console.log('   - ID:', testBooking.id);
    console.log('   - 圖片 URL:', testBooking.payment_image_url);
    
    // 驗證圖片 URL 是否正確保存
    if (testBooking.payment_image_url === urlData.publicUrl) {
      console.log('✅ 圖片 URL 已正確保存到資料庫');
    } else {
      console.error('❌ 圖片 URL 保存不正確');
      return false;
    }
    
    // 清理測試數據（可選）
    console.log('\n8️⃣ 清理測試數據...');
    const { error: deleteError } = await supabase
      .from('foodcarcalss')
      .delete()
      .eq('id', testBooking.id);
    
    if (deleteError) {
      console.warn('⚠️ 清理測試記錄失敗（可手動刪除）:', deleteError.message);
    } else {
      console.log('✅ 測試記錄已清理');
    }
    
    // 清理測試圖片（可選）
    const { error: deleteImageError } = await supabase.storage
      .from('foodcarcalss')
      .remove([fileName]);
    
    if (deleteImageError) {
      console.warn('⚠️ 清理測試圖片失敗（可手動刪除）:', deleteImageError.message);
    } else {
      console.log('✅ 測試圖片已清理');
    }
    
    console.log('\n🎉 所有測試通過！圖片上傳功能正常');
    return true;
    
  } catch (error) {
    console.error('\n❌ 測試過程中發生錯誤:', error);
    console.error('錯誤堆棧:', error.stack);
    return false;
  }
}

// 執行測試
if (require.main === module) {
  testImageUpload()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('測試執行失敗:', error);
      process.exit(1);
    });
}

module.exports = { testImageUpload };
