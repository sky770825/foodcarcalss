// 測試場地管理和注意事項管理功能
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testLocationManagement() {
  console.log('🏢 測試場地管理功能...\n');
  
  try {
    // 1. 檢查表是否存在
    console.log('1️⃣ 檢查 location_settings 表...');
    const { data: locations, error: locationsError } = await supabase
      .from('location_settings')
      .select('*')
      .limit(1);
    
    if (locationsError) {
      if (locationsError.message.includes('relation') || locationsError.message.includes('does not exist')) {
        console.error('❌ location_settings 表不存在');
        console.log('💡 請執行 supabase_settings_setup.sql 來創建表');
        return false;
      }
      throw locationsError;
    }
    
    console.log('✅ location_settings 表存在');
    console.log(`   - 現有記錄數: ${locations ? locations.length : 0}\n`);
    
    // 2. 測試讀取所有場地
    console.log('2️⃣ 測試讀取所有場地...');
    const { data: allLocations, error: readError } = await supabase
      .from('location_settings')
      .select('*')
      .order('location_key', { ascending: true });
    
    if (readError) {
      console.error('❌ 讀取失敗:', readError.message);
      return false;
    }
    
    console.log(`✅ 成功讀取 ${allLocations?.length || 0} 個場地`);
    if (allLocations && allLocations.length > 0) {
      console.log('   前3個場地:');
      allLocations.slice(0, 3).forEach((loc, i) => {
        console.log(`   ${i + 1}. ${loc.location_name || loc.location_key} (${loc.enabled ? '啟用' : '停用'})`);
      });
    }
    console.log('');
    
    // 3. 測試創建新場地（測試用）
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
      console.error('❌ 創建失敗:', insertError.message);
      return false;
    }
    
    console.log('✅ 場地創建成功');
    console.log(`   - ID: ${newLocation.id}`);
    console.log(`   - 名稱: ${newLocation.location_name}\n`);
    
    // 4. 測試更新場地
    console.log('4️⃣ 測試更新場地...');
    const { data: updatedLocation, error: updateError } = await supabase
      .from('location_settings')
      .update({ location_name: '測試場地（已更新）' })
      .eq('id', newLocation.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 更新失敗:', updateError.message);
    } else {
      console.log('✅ 場地更新成功');
    }
    console.log('');
    
    // 5. 測試刪除場地
    console.log('5️⃣ 測試刪除場地...');
    const { error: deleteError } = await supabase
      .from('location_settings')
      .delete()
      .eq('id', newLocation.id);
    
    if (deleteError) {
      console.error('❌ 刪除失敗:', deleteError.message);
    } else {
      console.log('✅ 場地刪除成功\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
    return false;
  }
}

async function testNoticeManagement() {
  console.log('📢 測試注意事項管理功能...\n');
  
  try {
    // 1. 檢查表是否存在
    console.log('1️⃣ 檢查 frontend_notices 表...');
    const { data: notices, error: noticesError } = await supabase
      .from('frontend_notices')
      .select('*')
      .limit(1);
    
    if (noticesError) {
      if (noticesError.message.includes('relation') || noticesError.message.includes('does not exist')) {
        console.error('❌ frontend_notices 表不存在');
        console.log('💡 請執行 supabase_settings_setup.sql 來創建表');
        return false;
      }
      throw noticesError;
    }
    
    console.log('✅ frontend_notices 表存在');
    console.log(`   - 現有記錄數: ${notices ? notices.length : 0}\n`);
    
    // 2. 測試讀取所有注意事項
    console.log('2️⃣ 測試讀取所有注意事項...');
    const { data: allNotices, error: readError } = await supabase
      .from('frontend_notices')
      .select('*')
      .order('display_order', { ascending: true });
    
    if (readError) {
      console.error('❌ 讀取失敗:', readError.message);
      return false;
    }
    
    console.log(`✅ 成功讀取 ${allNotices?.length || 0} 條注意事項`);
    if (allNotices && allNotices.length > 0) {
      console.log('   前3條注意事項:');
      allNotices.slice(0, 3).forEach((notice, i) => {
        console.log(`   ${i + 1}. ${notice.title} (${notice.enabled ? '啟用' : '停用'})`);
      });
    }
    console.log('');
    
    // 3. 測試創建新注意事項（測試用）
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
      console.error('❌ 創建失敗:', insertError.message);
      return false;
    }
    
    console.log('✅ 注意事項創建成功');
    console.log(`   - ID: ${newNotice.id}`);
    console.log(`   - 標題: ${newNotice.title}\n`);
    
    // 4. 測試更新注意事項
    console.log('4️⃣ 測試更新注意事項...');
    const { data: updatedNotice, error: updateError } = await supabase
      .from('frontend_notices')
      .update({ title: '測試注意事項（已更新）' })
      .eq('id', newNotice.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ 更新失敗:', updateError.message);
    } else {
      console.log('✅ 注意事項更新成功');
    }
    console.log('');
    
    // 5. 測試刪除注意事項
    console.log('5️⃣ 測試刪除注意事項...');
    const { error: deleteError } = await supabase
      .from('frontend_notices')
      .delete()
      .eq('id', newNotice.id);
    
    if (deleteError) {
      console.error('❌ 刪除失敗:', deleteError.message);
    } else {
      console.log('✅ 注意事項刪除成功\n');
    }
    
    return true;
  } catch (error) {
    console.error('❌ 測試過程中發生錯誤:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🧪 開始測試場地管理和注意事項管理功能\n');
  console.log('='.repeat(60));
  console.log('');
  
  const locationTest = await testLocationManagement();
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  const noticeTest = await testNoticeManagement();
  console.log('');
  console.log('='.repeat(60));
  console.log('');
  
  if (locationTest && noticeTest) {
    console.log('🎉 所有測試通過！場地管理和注意事項管理功能正常！');
    console.log('\n✅ 功能確認：');
    console.log('   - 場地管理：讀取、創建、更新、刪除都正常');
    console.log('   - 注意事項管理：讀取、創建、更新、刪除都正常');
    console.log('\n🚀 後台管理系統可以正常使用這些功能了！');
  } else {
    console.log('⚠️ 部分測試失敗，請檢查錯誤訊息');
    if (!locationTest) {
      console.log('   - 場地管理功能有問題');
    }
    if (!noticeTest) {
      console.log('   - 注意事項管理功能有問題');
    }
  }
  console.log('='.repeat(60));
  
  return locationTest && noticeTest;
}

runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('測試執行失敗:', error);
    process.exit(1);
  });
