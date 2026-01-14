// 診斷 Supabase Storage 設置
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseStorage() {
  console.log('🔍 開始診斷 Supabase Storage...\n');
  
  // 1. 測試列出所有 buckets
  console.log('1️⃣ 測試列出 buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
  
  if (bucketsError) {
    console.error('❌ 無法列出 buckets:', bucketsError.message);
    console.error('   錯誤詳情:', JSON.stringify(bucketsError, null, 2));
  } else {
    console.log('✅ 成功列出 buckets');
    if (buckets && buckets.length > 0) {
      console.log(`📋 找到 ${buckets.length} 個 bucket:`);
      buckets.forEach((b, i) => {
        console.log(`   ${i + 1}. ${b.name}`);
        console.log(`      - ID: ${b.id}`);
        console.log(`      - 公開: ${b.public ? '是' : '否'}`);
        console.log(`      - 創建時間: ${b.created_at || 'N/A'}`);
        console.log(`      - 更新時間: ${b.updated_at || 'N/A'}`);
        console.log(`      - 文件大小限制: ${b.file_size_limit ? (b.file_size_limit / 1024 / 1024).toFixed(2) + ' MB' : '無限制'}`);
        console.log(`      - 允許的 MIME 類型: ${b.allowed_mime_types?.join(', ') || '全部'}`);
        console.log('');
      });
    } else {
      console.log('⚠️ 沒有找到任何 bucket');
    }
  }
  
  // 2. 嘗試直接上傳到 foodcarcalss（即使列表為空，也可能存在）
  console.log('2️⃣ 嘗試直接上傳測試...');
  const testImageBuffer = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89,
    0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41, 0x54,
    0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01,
    0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44,
    0xAE, 0x42, 0x60, 0x82
  ]);
  
  const testFileName = `test_upload_${Date.now()}.png`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('foodcarcalss')
    .upload(testFileName, testImageBuffer, {
      contentType: 'image/png',
      cacheControl: '3600',
      upsert: false
    });
  
  if (uploadError) {
    console.error('❌ 上傳失敗:', uploadError.message);
    console.error('   錯誤代碼:', uploadError.statusCode || uploadError.status);
    console.error('   完整錯誤:', JSON.stringify(uploadError, null, 2));
    
    // 分析錯誤
    if (uploadError.message && uploadError.message.includes('Bucket not found')) {
      console.log('\n💡 問題診斷: Bucket "foodcarcalss" 不存在');
      console.log('   解決方案: 請在 Supabase Dashboard > Storage 中創建 bucket');
    } else if (uploadError.message && (uploadError.message.includes('row-level security') || uploadError.message.includes('RLS'))) {
      console.log('\n💡 問題診斷: RLS 政策未設置或設置錯誤');
      console.log('   解決方案: 請設置 Storage RLS 政策允許公開上傳');
    } else if (uploadError.statusCode === 403 || uploadError.status === 403) {
      console.log('\n💡 問題診斷: 權限不足');
      console.log('   解決方案: 檢查 bucket 是否設置為公開，以及 RLS 政策是否正確');
    }
  } else {
    console.log('✅ 上傳成功！');
    console.log('   - 路徑:', uploadData.path);
    
    // 獲取公開 URL
    const { data: urlData } = supabase.storage
      .from('foodcarcalss')
      .getPublicUrl(testFileName);
    
    if (urlData && urlData.publicUrl) {
      console.log('✅ 公開 URL 獲取成功:', urlData.publicUrl);
    }
    
    // 清理測試文件
    const { error: deleteError } = await supabase.storage
      .from('foodcarcalss')
      .remove([testFileName]);
    
    if (deleteError) {
      console.warn('⚠️ 清理測試文件失敗:', deleteError.message);
    } else {
      console.log('✅ 測試文件已清理');
    }
    
    console.log('\n🎉 Storage 設置正常！圖片上傳功能應該可以正常工作');
    return true;
  }
  
  // 3. 檢查 RLS 政策（如果可能）
  console.log('\n3️⃣ 檢查 RLS 政策...');
  try {
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('schemaname', 'storage')
      .eq('tablename', 'objects');
    
    if (policiesError) {
      console.log('⚠️ 無法查詢 RLS 政策（可能需要更高權限）');
    } else if (policies && policies.length > 0) {
      console.log(`✅ 找到 ${policies.length} 個 RLS 政策:`);
      policies.forEach(p => {
        console.log(`   - ${p.policyname} (${p.cmd})`);
      });
    } else {
      console.log('⚠️ 沒有找到 RLS 政策');
      console.log('   這可能是問題所在！請設置 RLS 政策');
    }
  } catch (e) {
    console.log('⚠️ 無法檢查 RLS 政策:', e.message);
  }
  
  return false;
}

diagnoseStorage()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('診斷過程發生錯誤:', error);
    process.exit(1);
  });
