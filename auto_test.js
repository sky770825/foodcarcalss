// 自動化完整測試腳本
// 執行方式：npm run auto 或 node auto_test.js
// 測試所有核心功能：場地管理、注意事項管理、預約管理

const { createClient } = require('@supabase/supabase-js');

// ========== 配置 ==========
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 測試結果追蹤 ==========
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

// ========== 輔助函數 ==========
function logTest(testName, passed, message = '') {
  if (passed) {
    testResults.passed.push(testName);
    console.log(`✅ ${testName}${message ? ': ' + message : ''}`);
  } else {
    testResults.failed.push({ name: testName, message });
    console.log(`❌ ${testName}${message ? ': ' + message : ''}`);
  }
}

function logWarning(message) {
  testResults.warnings.push(message);
  console.log(`⚠️  ${message}`);
}

// ========== 測試場地管理 ==========
async function testLocationManagement() {
  console.log('\n🏢 測試場地管理功能...\n');
  
  try {
    // 1. 檢查表是否存在
    console.log('1️⃣ 檢查 location_settings 表...');
    const { data: locations, error: locationsError } = await supabase
      .from('location_settings')
      .select('*')
      .limit(1);
    
    if (locationsError) {
      if (locationsError.message.includes('relation') || locationsError.message.includes('does not exist')) {
        logTest('location_settings 表存在', false, '表不存在，請執行 supabase_settings_setup.sql');
        return false;
      }
      throw locationsError;
    }
    
    logTest('location_settings 表存在', true);
    
    // 2. 測試讀取所有場地
    console.log('2️⃣ 測試讀取所有場地...');
    const { data: allLocations, error: readError } = await supabase
      .from('location_settings')
      .select('*')
      .order('location_key', { ascending: true });
    
    if (readError) {
      logTest('讀取場地', false, readError.message);
      return false;
    }
    
    logTest('讀取場地', true, `成功讀取 ${allLocations?.length || 0} 個場地`);
    
    if (allLocations && allLocations.length === 0) {
      logWarning('場地列表為空，建議初始化場地數據');
    }
    
    // 3. 測試創建場地（測試用）
    console.log('3️⃣ 測試創建場地...');
    const testLocation = {
      location_key: `test_location_${Date.now()}`,
      location_name: '測試場地',
      address: '測試地址',
      location_type: '戶外場地',
      enabled: true,
      available_days: [1, 2, 3, 4, 5],
      time_slots: ['14:00-20:00'],
      price_per_slot: { '14:00-20:00': '600元' },
      info: {
        hours: '14:00-20:00',
        fee: '600元/天',
        limit: '僅限1車',
        ban: '',
        special: ''
      },
      notices: ['測試注意事項']
    };
    
    const { data: newLocation, error: insertError } = await supabase
      .from('location_settings')
      .insert(testLocation)
      .select()
      .single();
    
    if (insertError) {
      logTest('創建場地', false, insertError.message);
      return false;
    }
    
    logTest('創建場地', true, `ID: ${newLocation.id}`);
    
    // 4. 測試更新場地
    console.log('4️⃣ 測試更新場地...');
    const { data: updatedLocation, error: updateError } = await supabase
      .from('location_settings')
      .update({ location_name: '測試場地（已更新）' })
      .eq('id', newLocation.id)
      .select()
      .single();
    
    if (updateError) {
      logTest('更新場地', false, updateError.message);
    } else {
      logTest('更新場地', true);
    }
    
    // 5. 測試刪除場地
    console.log('5️⃣ 測試刪除場地...');
    const { error: deleteError } = await supabase
      .from('location_settings')
      .delete()
      .eq('id', newLocation.id);
    
    if (deleteError) {
      logTest('刪除場地', false, deleteError.message);
    } else {
      logTest('刪除場地', true);
    }
    
    return true;
  } catch (error) {
    logTest('場地管理測試', false, error.message);
    return false;
  }
}

// ========== 測試注意事項管理 ==========
async function testNoticeManagement() {
  console.log('\n📢 測試注意事項管理功能...\n');
  
  try {
    // 1. 檢查表是否存在
    console.log('1️⃣ 檢查 frontend_notices 表...');
    const { data: notices, error: noticesError } = await supabase
      .from('frontend_notices')
      .select('*')
      .limit(1);
    
    if (noticesError) {
      if (noticesError.message.includes('relation') || noticesError.message.includes('does not exist')) {
        logTest('frontend_notices 表存在', false, '表不存在，請執行 supabase_settings_setup.sql');
        return false;
      }
      throw noticesError;
    }
    
    logTest('frontend_notices 表存在', true);
    
    // 2. 測試讀取所有注意事項
    console.log('2️⃣ 測試讀取所有注意事項...');
    const { data: allNotices, error: readError } = await supabase
      .from('frontend_notices')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (readError) {
      logTest('讀取注意事項', false, readError.message);
      return false;
    }
    
    logTest('讀取注意事項', true, `成功讀取 ${allNotices?.length || 0} 條注意事項`);
    
    if (allNotices && allNotices.length === 0) {
      logWarning('注意事項列表為空，建議初始化注意事項數據');
    }
    
    // 3. 測試創建注意事項（測試用）
    console.log('3️⃣ 測試創建注意事項...');
    const testNotice = {
      notice_key: `test_notice_${Date.now()}`,
      title: '測試注意事項',
      content: '這是一條測試注意事項',
      display_order: 999,
      enabled: true,
      notice_type: 'info',
      target_location: null
    };
    
    const { data: newNotice, error: insertError } = await supabase
      .from('frontend_notices')
      .insert(testNotice)
      .select()
      .single();
    
    if (insertError) {
      logTest('創建注意事項', false, insertError.message);
      return false;
    }
    
    logTest('創建注意事項', true, `ID: ${newNotice.id}`);
    
    // 4. 測試更新注意事項
    console.log('4️⃣ 測試更新注意事項...');
    const { data: updatedNotice, error: updateError } = await supabase
      .from('frontend_notices')
      .update({ title: '測試注意事項（已更新）' })
      .eq('id', newNotice.id)
      .select()
      .single();
    
    if (updateError) {
      logTest('更新注意事項', false, updateError.message);
    } else {
      logTest('更新注意事項', true);
    }
    
    // 5. 測試刪除注意事項
    console.log('5️⃣ 測試刪除注意事項...');
    const { error: deleteError } = await supabase
      .from('frontend_notices')
      .delete()
      .eq('id', newNotice.id);
    
    if (deleteError) {
      logTest('刪除注意事項', false, deleteError.message);
    } else {
      logTest('刪除注意事項', true);
    }
    
    return true;
  } catch (error) {
    logTest('注意事項管理測試', false, error.message);
    return false;
  }
}

// ========== 測試預約管理 ==========
async function testBookingManagement() {
  console.log('\n📅 測試預約管理功能...\n');
  
  try {
    // 1. 檢查表是否存在
    console.log('1️⃣ 檢查 foodcarcalss 表...');
    const { data: bookings, error: bookingsError } = await supabase
      .from('foodcarcalss')
      .select('*')
      .limit(1);
    
    if (bookingsError) {
      if (bookingsError.message.includes('relation') || bookingsError.message.includes('does not exist')) {
        logTest('foodcarcalss 表存在', false, '表不存在');
        return false;
      }
      throw bookingsError;
    }
    
    logTest('foodcarcalss 表存在', true);
    
    // 2. 測試讀取預約
    console.log('2️⃣ 測試讀取預約...');
    const { data: allBookings, error: readError } = await supabase
      .from('foodcarcalss')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (readError) {
      logTest('讀取預約', false, readError.message);
      return false;
    }
    
    logTest('讀取預約', true, `成功讀取 ${allBookings?.length || 0} 筆預約（顯示前10筆）`);
    
    // 3. 檢查 payment_image_url 欄位
    console.log('3️⃣ 檢查 payment_image_url 欄位...');
    const { data: bookingWithImage, error: imageCheckError } = await supabase
      .from('foodcarcalss')
      .select('payment_image_url')
      .not('payment_image_url', 'is', null)
      .limit(1);
    
    if (imageCheckError) {
      if (imageCheckError.message.includes('column') || imageCheckError.message.includes('does not exist')) {
        logWarning('payment_image_url 欄位不存在，請執行 add_payment_image_column.sql');
      } else {
        logTest('檢查 payment_image_url 欄位', false, imageCheckError.message);
      }
    } else {
      logTest('payment_image_url 欄位存在', true, `有 ${bookingWithImage?.length || 0} 筆預約包含圖片`);
    }
    
    return true;
  } catch (error) {
    logTest('預約管理測試', false, error.message);
    return false;
  }
}

// ========== 測試 Storage ==========
async function testStorage() {
  console.log('\n📦 測試 Supabase Storage...\n');
  
  try {
    // 1. 檢查 bucket 是否存在
    console.log('1️⃣ 檢查 foodcarcalss bucket...');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      logTest('檢查 bucket', false, bucketsError.message);
      return false;
    }
    
    const bucket = buckets?.find(b => b.name === 'foodcarcalss');
    if (!bucket) {
      logWarning('foodcarcalss bucket 不存在，請在 Supabase Dashboard 中創建');
      return false;
    }
    
    logTest('foodcarcalss bucket 存在', true);
    
    // 2. 測試上傳（可選）
    console.log('2️⃣ 測試上傳功能...');
    const testFileName = `test_${Date.now()}.txt`;
    const testContent = '這是一個測試文件';
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('foodcarcalss')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: false
      });
    
    if (uploadError) {
      logTest('上傳測試', false, uploadError.message);
      return false;
    }
    
    logTest('上傳測試', true, `文件: ${testFileName}`);
    
    // 3. 清理測試文件
    const { error: deleteError } = await supabase.storage
      .from('foodcarcalss')
      .remove([testFileName]);
    
    if (deleteError) {
      logWarning(`無法刪除測試文件: ${deleteError.message}`);
    } else {
      logTest('清理測試文件', true);
    }
    
    return true;
  } catch (error) {
    logTest('Storage 測試', false, error.message);
    return false;
  }
}

// ========== 主測試函數 ==========
async function runAllTests() {
  console.log('🧪 開始自動化完整測試\n');
  console.log('='.repeat(60));
  
  const locationTest = await testLocationManagement();
  console.log('');
  console.log('='.repeat(60));
  
  const noticeTest = await testNoticeManagement();
  console.log('');
  console.log('='.repeat(60));
  
  const bookingTest = await testBookingManagement();
  console.log('');
  console.log('='.repeat(60));
  
  const storageTest = await testStorage();
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  // 總結
  console.log('📊 測試總結：\n');
  console.log(`✅ 通過: ${testResults.passed.length} 項`);
  console.log(`❌ 失敗: ${testResults.failed.length} 項`);
  console.log(`⚠️  警告: ${testResults.warnings.length} 項`);
  console.log('');
  
  if (testResults.failed.length > 0) {
    console.log('❌ 失敗的測試：');
    testResults.failed.forEach(f => {
      console.log(`   - ${f.name}: ${f.message}`);
    });
    console.log('');
  }
  
  if (testResults.warnings.length > 0) {
    console.log('⚠️  警告：');
    testResults.warnings.forEach(w => {
      console.log(`   - ${w}`);
    });
    console.log('');
  }
  
  const allPassed = testResults.failed.length === 0;
  
  if (allPassed) {
    console.log('🎉 所有核心測試通過！系統功能正常！');
  } else {
    console.log('⚠️  部分測試失敗，請檢查錯誤訊息並修復問題');
  }
  
  console.log('='.repeat(60));
  
  return allPassed;
}

// ========== 執行測試 ==========
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  });
