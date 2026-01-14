// 完整功能測試：測試所有 CRUD 操作和換班功能
// 執行方式：node 完整功能測試.js

const { createClient } = require('@supabase/supabase-js');

// ========== 配置 ==========
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

// ========== 初始化 Supabase ==========
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ========== 測試結果追蹤 ==========
const testResults = {
  passed: [],
  failed: []
};

// ========== 輔助函數 ==========
function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

function formatDateForDisplay(dateStr) {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return dateStr;
    }
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = dayNames[date.getDay()];
    return `${month}月${day}日(${dayName})`;
  } catch (error) {
    return dateStr;
  }
}

function logTest(testName, passed, message = '') {
  if (passed) {
    testResults.passed.push(testName);
    console.log(`✅ ${testName}${message ? ': ' + message : ''}`);
  } else {
    testResults.failed.push({ name: testName, message });
    console.error(`❌ ${testName}${message ? ': ' + message : ''}`);
  }
}

// ========== 測試函數 ==========

// 測試 1: 新增預約
async function testAddBooking() {
  const testName = '新增預約';
  try {
    const testData = {
      timestamp: new Date().toISOString(),
      vendor: '測試餐車_新增',
      food_type: '測試類型',
      location: '四維路59號',
      booking_date: formatDateForDisplay(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()), // 30天後
      status: '己排',
      fee: '600元/天',
      payment: '未繳款',
      note: '自動測試新增的預約'
    };
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .insert(testData)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data && data.id) {
      // 儲存測試 ID 供後續測試使用
      global.testBookingId = data.id;
      logTest(testName, true, `成功新增，ID: ${data.id}`);
      return data;
    } else {
      logTest(testName, false, '新增成功但未返回資料');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 2: 讀取預約
async function testReadBooking(bookingId) {
  const testName = '讀取預約';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return null;
    }
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .select('*')
      .eq('id', bookingId)
      .single();
    
    if (error) throw error;
    
    if (data && data.id === bookingId) {
      logTest(testName, true, `成功讀取，餐車: ${data.vendor}`);
      return data;
    } else {
      logTest(testName, false, '讀取失敗或資料不匹配');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 3: 更新預約（編輯）
async function testUpdateBooking(bookingId) {
  const testName = '更新預約（編輯）';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return null;
    }
    
    const updateData = {
      vendor: '測試餐車_已更新',
      food_type: '更新後的類型',
      payment: '己繳款',
      note: '自動測試更新後的備註'
    };
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update(updateData)
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data && data.vendor === '測試餐車_已更新' && data.payment === '己繳款') {
      logTest(testName, true, `成功更新，新餐車名: ${data.vendor}`);
      return data;
    } else {
      logTest(testName, false, '更新失敗或資料不匹配');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 4: 更新付款狀態
async function testUpdatePaymentStatus(bookingId) {
  const testName = '更新付款狀態';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return null;
    }
    
    const { data: before } = await supabase
      .from('foodcarcalss')
      .select('payment')
      .eq('id', bookingId)
      .single();
    
    const newPaymentStatus = before.payment === '己繳款' ? '未繳款' : '己繳款';
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update({ payment: newPaymentStatus })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data && data.payment === newPaymentStatus) {
      logTest(testName, true, `成功更新付款狀態: ${before.payment} → ${newPaymentStatus}`);
      return data;
    } else {
      logTest(testName, false, '付款狀態更新失敗');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 5: 接手預約（Takeover）
async function testTakeoverBooking(bookingId) {
  const testName = '接手預約（Takeover）';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return null;
    }
    
    const takeoverData = {
      vendor: '測試餐車_接手',
      food_type: '接手後的類型',
      payment: '未繳款' // 接手後需要重新付款
    };
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update(takeoverData)
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data && data.vendor === '測試餐車_接手' && data.payment === '未繳款') {
      logTest(testName, true, `成功接手，新餐車: ${data.vendor}`);
      return data;
    } else {
      logTest(testName, false, '接手失敗或資料不匹配');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 6: 排班釋出（Transfer）
async function testTransferBooking(bookingId) {
  const testName = '排班釋出（Transfer）';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return null;
    }
    
    const transferData = {
      vendor: '測試餐車_釋出',
      food_type: '釋出後的類型',
      payment: '未繳款' // 釋出後需要重新付款
    };
    
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update(transferData)
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    if (data && data.vendor === '測試餐車_釋出') {
      logTest(testName, true, `成功釋出，新餐車: ${data.vendor}`);
      return data;
    } else {
      logTest(testName, false, '釋出失敗或資料不匹配');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 7: 刪除預約
async function testDeleteBooking(bookingId) {
  const testName = '刪除預約';
  try {
    if (!bookingId) {
      logTest(testName, false, '沒有可測試的預約 ID');
      return false;
    }
    
    const { error } = await supabase
      .from('foodcarcalss')
      .delete()
      .eq('id', bookingId);
    
    if (error) throw error;
    
    // 驗證是否真的被刪除
    const { data: verify } = await supabase
      .from('foodcarcalss')
      .select('id')
      .eq('id', bookingId)
      .single();
    
    if (!verify) {
      logTest(testName, true, '成功刪除並驗證');
      return true;
    } else {
      logTest(testName, false, '刪除失敗，記錄仍存在');
      return false;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return false;
  }
}

// 測試 8: 批量查詢
async function testBatchQuery() {
  const testName = '批量查詢';
  try {
    const { data, error, count } = await supabase
      .from('foodcarcalss')
      .select('*', { count: 'exact' })
      .limit(10);
    
    if (error) throw error;
    
    if (data && Array.isArray(data) && count !== null) {
      logTest(testName, true, `成功查詢 ${data.length} 筆（總計 ${count} 筆）`);
      return { data, count };
    } else {
      logTest(testName, false, '查詢失敗或格式錯誤');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 9: 按條件篩選
async function testFilterQuery() {
  const testName = '按條件篩選';
  try {
    // 測試按付款狀態篩選
    const { data, error } = await supabase
      .from('foodcarcalss')
      .select('*')
      .eq('payment', '未繳款')
      .limit(5);
    
    if (error) throw error;
    
    if (data && Array.isArray(data)) {
      const allUnpaid = data.every(b => b.payment === '未繳款' || !b.payment);
      if (allUnpaid) {
        logTest(testName, true, `成功篩選出 ${data.length} 筆未付款記錄`);
        return data;
      } else {
        logTest(testName, false, '篩選結果不正確');
        return null;
      }
    } else {
      logTest(testName, false, '篩選失敗');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// 測試 10: 按日期排序
async function testOrderByDate() {
  const testName = '按日期排序';
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .select('*')
      .order('booking_date', { ascending: true })
      .limit(5);
    
    if (error) throw error;
    
    if (data && Array.isArray(data) && data.length > 0) {
      logTest(testName, true, `成功排序，前5筆日期: ${data.map(b => b.booking_date).join(', ')}`);
      return data;
    } else {
      logTest(testName, false, '排序失敗或無資料');
      return null;
    }
  } catch (error) {
    logTest(testName, false, error.message);
    return null;
  }
}

// ========== 主測試函數 ==========
async function runAllTests() {
  console.log('========================================');
  console.log('🧪 開始完整功能測試');
  console.log('========================================');
  console.log('');
  
  try {
    // 測試 1: 新增
    const newBooking = await testAddBooking();
    await new Promise(resolve => setTimeout(resolve, 500)); // 等待一下
    
    // 測試 2: 讀取
    await testReadBooking(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 3: 更新（編輯）
    await testUpdateBooking(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 4: 更新付款狀態
    await testUpdatePaymentStatus(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 5: 接手預約
    await testTakeoverBooking(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 6: 排班釋出
    await testTransferBooking(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 7: 刪除
    await testDeleteBooking(global.testBookingId);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 8: 批量查詢
    await testBatchQuery();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 9: 按條件篩選
    await testFilterQuery();
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 測試 10: 按日期排序
    await testOrderByDate();
    
    // 顯示測試結果
    console.log('');
    console.log('========================================');
    console.log('📊 測試結果總結');
    console.log('========================================');
    console.log(`✅ 通過: ${testResults.passed.length} 項`);
    console.log(`❌ 失敗: ${testResults.failed.length} 項`);
    console.log('');
    
    if (testResults.passed.length > 0) {
      console.log('✅ 通過的測試:');
      testResults.passed.forEach(test => {
        console.log(`   - ${test}`);
      });
      console.log('');
    }
    
    if (testResults.failed.length > 0) {
      console.log('❌ 失敗的測試:');
      testResults.failed.forEach(test => {
        console.log(`   - ${test.name}: ${test.message}`);
      });
      console.log('');
    }
    
    const successRate = (testResults.passed.length / (testResults.passed.length + testResults.failed.length) * 100).toFixed(1);
    console.log(`📈 成功率: ${successRate}%`);
    console.log('========================================');
    
    if (testResults.failed.length === 0) {
      console.log('');
      console.log('🎉 所有測試通過！系統功能正常！');
    } else {
      console.log('');
      console.log('⚠️  部分測試失敗，請檢查上述錯誤訊息');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('');
    console.error('========================================');
    console.error('❌ 測試過程發生嚴重錯誤');
    console.error('========================================');
    console.error('錯誤訊息:', error.message);
    console.error('錯誤堆疊:', error.stack);
    console.error('========================================');
    process.exit(1);
  }
}

// 執行測試
runAllTests();
