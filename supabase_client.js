// Supabase 客戶端 - 用於前端和後台系統
// 請將此檔案引入到需要使用的頁面

// ========== 配置 ==========
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

// ========== 初始化 Supabase 客戶端 ==========
// 如果使用 CDN 方式引入 Supabase
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
let supabase;

if (typeof supabaseClient !== 'undefined') {
  // 如果已經全局引入 Supabase
  supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
  // 需要先引入 Supabase JS 庫
  console.warn('請先引入 Supabase JS 庫: https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2');
}

// ========== API 函數 ==========

// 獲取所有預約
async function getAllBookings() {
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .select('*')
      .order('booking_date', { ascending: true });
    
    if (error) throw error;
    
    // 轉換為與 Google Sheets 相同的格式
    return {
      success: true,
      bookings: data.map((row, index) => ({
        timestamp: row.timestamp,
        vendor: row.vendor,
        foodType: row.food_type,
        location: row.location,
        date: row.booking_date,
        status: row.status,
        bookedStatus: row.status,
        fee: row.fee,
        payment: row.payment,
        note: row.note,
        id: row.id, // Supabase 使用 id 而不是 rowNumber
        rowNumber: row.id // 為了向後兼容
      })),
      lastUpdate: new Date().toISOString()
    };
  } catch (error) {
    console.error('獲取預約資料失敗:', error);
    return {
      success: false,
      message: error.message,
      bookings: []
    };
  }
}

// 新增預約
async function addBooking(bookingData) {
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .insert({
        vendor: bookingData.vendor,
        food_type: bookingData.foodType,
        location: bookingData.location,
        booking_date: bookingData.date,
        status: bookingData.status || '己排',
        fee: bookingData.fee || '600元/天',
        payment: bookingData.payment || '未繳款',
        note: bookingData.note || ''
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      message: '預約已成功新增',
      booking: data
    };
  } catch (error) {
    console.error('新增預約失敗:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 更新預約
async function updateBooking(bookingId, updateData) {
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update({
        vendor: updateData.vendor,
        food_type: updateData.foodType,
        location: updateData.location,
        booking_date: updateData.date,
        status: updateData.status,
        fee: updateData.fee,
        payment: updateData.payment,
        note: updateData.note
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      message: '預約已成功更新',
      booking: data
    };
  } catch (error) {
    console.error('更新預約失敗:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 更新付款狀態
async function updatePaymentStatus(bookingId, payment) {
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update({ payment: payment })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      message: '付款狀態已更新',
      booking: data
    };
  } catch (error) {
    console.error('更新付款狀態失敗:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 刪除預約
async function deleteBooking(bookingId) {
  try {
    const { error } = await supabase
      .from('foodcarcalss')
      .delete()
      .eq('id', bookingId);
    
    if (error) throw error;
    
    return {
      success: true,
      message: '預約已成功刪除'
    };
  } catch (error) {
    console.error('刪除預約失敗:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 接手預約（更新為新的餐車資訊）
async function takeoverBooking(bookingId, newVendorData) {
  try {
    const { data, error } = await supabase
      .from('foodcarcalss')
      .update({
        vendor: newVendorData.vendor,
        food_type: newVendorData.foodType,
        payment: '未繳款' // 接手後需要重新付款
      })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      message: '預約已成功接手',
      booking: data
    };
  } catch (error) {
    console.error('接手預約失敗:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// 匯出函數
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getAllBookings,
    addBooking,
    updateBooking,
    updatePaymentStatus,
    deleteBooking,
    takeoverBooking
  };
}
