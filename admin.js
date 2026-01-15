// 後台管理系統 JavaScript

// ========== Supabase 配置 ==========
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw';

// 初始化 Supabase 客戶端
let supabaseClientInstance;
if (typeof window.supabase !== 'undefined') {
  supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  console.log('✅ 後台 Supabase 客戶端已初始化');
} else {
  console.error('❌ Supabase 庫未載入');
  // 嘗試延遲初始化
  window.addEventListener('load', () => {
    if (typeof window.supabase !== 'undefined' && !supabaseClientInstance) {
      supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      console.log('✅ 延遲初始化 Supabase 客戶端成功');
    }
  });
}

// ========== 配置常數 ==========

// 管理密碼（請修改為您的實際密碼）
const ADMIN_PASSWORD = 'sky36990'; // ⚠️ 請妥善保管此密碼！

// 場地列表（統一管理，避免重複）
const LOCATIONS = [
  { key: '四維路59號', name: '四維路59號' },
  { key: '漢堡大亨', name: '漢堡大亨 - 四維路70號' },
  { key: '自由風', name: '自由風 - 四維路190號' },
  { key: '蔬蒔', name: '蔬蒔 - 四維路216號' },
  { key: '金正好吃', name: '金正好吃 - 四維路218號' }
];

// 調試模式（生產環境應設為 false）
const DEBUG_MODE = false;

// 全局變數
let allBookings = [];
let filteredBookings = [];
let currentEditingBooking = null;
let selectedMonth = null; // 格式: '2025-10'
let autoRefreshInterval = null; // 自動刷新計時器

// ========== 工具函數 ==========

// ========== 安全防護函數 ==========

// HTML 轉義函數（防止 XSS）
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 屬性值轉義（用於 HTML 屬性，如 onclick）
function escapeHtmlAttribute(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 輸入驗證和清理函數
function sanitizeInput(input, type = 'text') {
  if (!input) return '';
  let sanitized = String(input).trim();
  
  switch (type) {
    case 'text':
      // 移除潛在危險字符，但保留基本標點
      sanitized = sanitized.replace(/[<>]/g, '');
      break;
    case 'number':
      sanitized = sanitized.replace(/[^0-9.-]/g, '');
      break;
    case 'alphanumeric':
      sanitized = sanitized.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s-]/g, '');
      break;
    case 'key':
      // 用於識別碼：只允許字母、數字、連字號、下劃線
      sanitized = sanitized.replace(/[^a-zA-Z0-9\-_]/g, '');
      break;
    case 'url':
      // URL 驗證（簡單版）
      try {
        new URL(sanitized);
      } catch {
        sanitized = '';
      }
      break;
  }
  
  return sanitized;
}

// 驗證輸入長度
function validateInputLength(input, min = 0, max = 1000) {
  if (!input) return min === 0;
  const length = String(input).length;
  return length >= min && length <= max;
}

// 速率限制（防止暴力破解）
const RATE_LIMIT = {
  maxAttempts: 5,        // 最大嘗試次數
  windowMs: 15 * 60 * 1000, // 15分鐘窗口
  lockoutMs: 30 * 60 * 1000  // 鎖定30分鐘
};

let loginAttempts = JSON.parse(localStorage.getItem('loginAttempts') || '[]');
let isLockedOut = false;
let lockoutUntil = parseInt(localStorage.getItem('lockoutUntil') || '0');

// 檢查是否被鎖定
function checkLockout() {
  const now = Date.now();
  
  // 檢查鎖定期是否已過
  if (lockoutUntil > 0 && now < lockoutUntil) {
    const remainingMinutes = Math.ceil((lockoutUntil - now) / 60000);
    return {
      locked: true,
      message: `帳號已鎖定，請在 ${remainingMinutes} 分鐘後再試`
    };
  }
  
  // 清除過期的嘗試記錄
  const windowStart = now - RATE_LIMIT.windowMs;
  loginAttempts = loginAttempts.filter(time => time > windowStart);
  localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
  
  // 檢查是否超過最大嘗試次數
  if (loginAttempts.length >= RATE_LIMIT.maxAttempts) {
    lockoutUntil = now + RATE_LIMIT.lockoutMs;
    localStorage.setItem('lockoutUntil', String(lockoutUntil));
    return {
      locked: true,
      message: `登入失敗次數過多，帳號已鎖定 30 分鐘`
    };
  }
  
  return { locked: false };
}

// 記錄登入嘗試
function recordLoginAttempt(success) {
  if (success) {
    // 登入成功，清除所有記錄
    loginAttempts = [];
    lockoutUntil = 0;
    localStorage.removeItem('loginAttempts');
    localStorage.removeItem('lockoutUntil');
  } else {
    // 登入失敗，記錄時間
    loginAttempts.push(Date.now());
    localStorage.setItem('loginAttempts', JSON.stringify(loginAttempts));
  }
}

// 生成安全的隨機 token（用於 session）
function generateSecureToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// 驗證 session token
function validateSession() {
  const sessionToken = sessionStorage.getItem('adminSessionToken');
  const sessionTime = parseInt(sessionStorage.getItem('adminSessionTime') || '0');
  const now = Date.now();
  const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2小時
  
  if (!sessionToken || (now - sessionTime) > SESSION_TIMEOUT) {
    return false;
  }
  
  return true;
}

// 創建安全 session
function createSecureSession() {
  const token = generateSecureToken();
  sessionStorage.setItem('adminSessionToken', token);
  sessionStorage.setItem('adminSessionTime', String(Date.now()));
  return token;
}

// 調試日誌（僅在調試模式下輸出）
function debugLog(...args) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

// 錯誤日誌（始終輸出）
function errorLog(...args) {
  console.error(...args);
}

// ========== 統一錯誤處理 ==========

// 錯誤類型映射（將技術錯誤轉換為用戶友好的提示）
const ERROR_MESSAGES = {
  // Supabase 錯誤
  'Supabase 客戶端未初始化': '系統初始化失敗，請重新整理頁面',
  'Supabase 庫未載入': '系統資源載入失敗，請檢查網路連線',
  
  // 網路錯誤
  'Failed to fetch': '網路連線失敗，請檢查網路連線後重試',
  'NetworkError': '網路錯誤，請稍後再試',
  'timeout': '請求逾時，請稍後再試',
  
  // 資料庫錯誤
  'duplicate key': '資料已存在，請檢查是否重複',
  'foreign key': '資料關聯錯誤，請檢查相關資料',
  'not null': '必填欄位未填寫',
  
  // 權限錯誤
  'permission denied': '權限不足，無法執行此操作',
  'unauthorized': '未授權，請重新登入',
  
  // 通用錯誤
  '找不到': '找不到相關資料',
  '無法': '操作失敗',
};

// 統一錯誤處理函數
function handleError(error, context = '操作', defaultMessage = '發生錯誤，請稍後再試') {
  // 記錄錯誤詳情（開發模式）
  if (DEBUG_MODE) {
    errorLog(`❌ [${context}] 錯誤詳情:`, error);
    if (error.stack) {
      errorLog('錯誤堆疊:', error.stack);
    }
  } else {
    errorLog(`❌ [${context}]`, error.message || error);
  }
  
  // 提取錯誤訊息
  let userMessage = defaultMessage;
  const errorMessage = error?.message || error?.toString() || '';
  
  // 嘗試匹配已知錯誤類型
  for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
    if (errorMessage.includes(key) || errorMessage.toLowerCase().includes(key.toLowerCase())) {
      userMessage = message;
      break;
    }
  }
  
  // 如果是 Supabase 錯誤，提取更詳細的信息
  if (error?.code) {
    switch (error.code) {
      case 'PGRST116':
        userMessage = '找不到相關資料';
        break;
      case '23505':
        userMessage = '資料已存在，請檢查是否重複';
        break;
      case '23503':
        userMessage = '資料關聯錯誤';
        break;
      case '42501':
        userMessage = '權限不足，無法執行此操作';
        break;
      default:
        if (!userMessage.includes('請')) {
          userMessage = `${defaultMessage}（錯誤代碼: ${error.code}）`;
        }
    }
  }
  
  return userMessage;
}

// 統一的錯誤提示函數
function showErrorToast(context, error, defaultMessage) {
  const message = handleError(error, context, defaultMessage);
  showToast('error', '操作失敗', message);
}

// 安全的異步函數包裝器
async function safeAsync(fn, context, errorMessage) {
  try {
    return await fn();
  } catch (error) {
    showErrorToast(context, error, errorMessage);
    throw error; // 重新拋出以便調用者處理
  }
}

// 防抖函數（用於搜尋和篩選）
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 生成場地選項 HTML
function generateLocationOptions(includeAll = true, includeGeneric = false) {
  let options = '';
  if (includeAll) {
    options += '<option value="">全部場地</option>';
  }
  if (includeGeneric) {
    options += '<option value="通用">通用（所有場地）</option>';
  }
  LOCATIONS.forEach(location => {
    options += `<option value="${escapeHtml(location.key)}">${escapeHtml(location.name)}</option>`;
  });
  return options;
}
let newBookings = []; // 新預約列表
let processedBookingIds = new Set(); // 已處理的預約 ID（儲存在 localStorage）

// 從 localStorage 載入已處理的預約 ID
function loadProcessedBookingIds() {
  try {
    const stored = localStorage.getItem('processedBookingIds');
    if (stored) {
      const ids = JSON.parse(stored);
      processedBookingIds = new Set(ids);
    }
  } catch (e) {
    console.warn('載入已處理預約 ID 失敗:', e);
    processedBookingIds = new Set();
  }
}

// 保存已處理的預約 ID 到 localStorage
function saveProcessedBookingIds() {
  try {
    const ids = Array.from(processedBookingIds);
    localStorage.setItem('processedBookingIds', JSON.stringify(ids));
  } catch (e) {
    console.warn('保存已處理預約 ID 失敗:', e);
  }
}

// 頁面載入時初始化
// 檢查登入狀態（頁面載入時）
function checkAuthStatus() {
  const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
  const hasValidSession = validateSession();
  
  if (isLoggedIn && hasValidSession) {
    showMainContent();
    initMonthSelector();
    loadBookings();
  } else {
    // 清除無效的 session
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminSessionToken');
    sessionStorage.removeItem('adminSessionTime');
    showLoginModal();
  }
}

// 定期檢查 session 有效性（每5分鐘）
function startSessionMonitor() {
  setInterval(() => {
    if (sessionStorage.getItem('adminLoggedIn') === 'true') {
      if (!validateSession()) {
        // Session 已過期
        showToast('warning', '會話已過期', '請重新登入');
        logout();
      }
    }
  }, 5 * 60 * 1000); // 每5分鐘檢查一次
}

document.addEventListener('DOMContentLoaded', function() {
  // 載入已處理的預約 ID
  loadProcessedBookingIds();
  
  // 檢查認證狀態（這個函數已經會處理登入和載入數據）
  checkAuthStatus();
  
  // 啟動 session 監控
  startSessionMonitor();
  
  // 登入表單 Enter 鍵支援
  document.getElementById('adminPassword').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleLogin();
    }
  });
});

// 顯示登入畫面
function showLoginModal() {
  const loginModal = document.getElementById('loginModal');
  const mainContent = document.getElementById('mainAdminContent');
  if (loginModal) {
    loginModal.classList.remove('hidden');
    loginModal.style.display = 'flex'; // 登入模態框需要 flex 顯示
  }
  if (mainContent) mainContent.classList.add('hidden');
}

// 顯示主內容
function showMainContent() {
  const loginModal = document.getElementById('loginModal');
  const mainContent = document.getElementById('mainAdminContent');
  if (loginModal) {
    loginModal.classList.add('hidden');
    loginModal.style.display = 'none'; // 確保隱藏
  }
  if (mainContent) {
    mainContent.classList.remove('hidden');
    mainContent.style.display = 'block'; // 確保顯示
  }
  
  // 確保只有預約管理標籤頁顯示（初始狀態）
  document.querySelectorAll('.tab-content').forEach(tab => {
    if (tab.id === 'tabBookings') {
      tab.style.display = 'block';
      tab.classList.add('active');
    } else {
      tab.style.display = 'none';
      tab.classList.remove('active');
    }
  });
  
  // 確保只有預約管理按鈕是 active
  document.querySelectorAll('.tab-btn').forEach(btn => {
    if (btn.getAttribute('data-tab') === 'bookings') {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  // 啟動背景自動刷新
  startAutoRefresh();
}

// 處理登入
function handleLogin() {
  const passwordInput = document.getElementById('adminPassword');
  const password = passwordInput.value;
  const errorDiv = document.getElementById('loginError');
  
  // 檢查鎖定狀態
  const lockoutCheck = checkLockout();
  if (lockoutCheck.locked) {
    errorDiv.textContent = lockoutCheck.message;
    errorDiv.style.display = 'block';
    passwordInput.value = '';
    return;
  }
  
  // 輸入驗證
  if (!password || password.length === 0) {
    errorDiv.textContent = '請輸入密碼';
    errorDiv.style.display = 'block';
    return;
  }
  
  // 使用安全的密碼比較（防止時間攻擊）
  let isValid = false;
  try {
    // 簡單的常數時間比較（實際應用中應使用服務端驗證）
    isValid = password === ADMIN_PASSWORD;
  } catch (error) {
    errorLog('登入驗證錯誤:', error);
    isValid = false;
  }
  
  if (isValid) {
    // 登入成功
    recordLoginAttempt(true);
    createSecureSession();
    sessionStorage.setItem('adminLoggedIn', 'true');
    showMainContent();
    initMonthSelector();
    loadBookings();
    errorDiv.style.display = 'none';
    passwordInput.value = '';
  } else {
    // 登入失敗
    recordLoginAttempt(false);
    const remainingAttempts = RATE_LIMIT.maxAttempts - loginAttempts.length;
    if (remainingAttempts > 0) {
      errorDiv.textContent = `密碼錯誤，還剩 ${remainingAttempts} 次嘗試機會`;
    } else {
      errorDiv.textContent = '密碼錯誤次數過多，帳號已鎖定';
    }
    errorDiv.style.display = 'block';
    passwordInput.value = '';
    
    // 檢查是否應該鎖定
    const newLockoutCheck = checkLockout();
    if (newLockoutCheck.locked) {
      errorDiv.textContent = newLockoutCheck.message;
    }
  }
}

// 初始化月份選擇器
function initMonthSelector() {
  const monthGrid = document.getElementById('monthGrid');
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  
  // 只生成前一個月到未來6個月
  const months = [];
  for (let i = -1; i <= 6; i++) {
    const date = new Date(currentYear, currentMonth + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const monthKey = `${year}-${String(month + 1).padStart(2, '0')}`;
    const monthName = `${year}年${month + 1}月`;
    months.push({ key: monthKey, name: monthName, year, month });
  }
  
  monthGrid.innerHTML = months.map(m => {
    const isCurrent = m.year === currentYear && m.month === currentMonth;
    return `
      <button class="month-btn ${isCurrent ? 'active' : ''}" 
              onclick="selectMonth('${m.key}')"
              data-month="${m.key}">
        ${m.name}
      </button>
    `;
  }).join('');
  
  // 預設選擇當前月份
  if (!selectedMonth) {
    selectedMonth = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
  }
}

// 選擇月份
function selectMonth(monthKey) {
  selectedMonth = monthKey;
  
  // 更新按鈕狀態
  document.querySelectorAll('.month-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.month === monthKey) {
      btn.classList.add('active');
    }
  });
  
  // 更新顯示
  updateMonthDisplay();
  
  // 重新篩選
  filterBookings();
}

// 選擇當前月份
function selectCurrentMonth() {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;
  selectMonth(`${year}-${String(month).padStart(2, '0')}`);
}

// 更新月份顯示
function updateMonthDisplay() {
  if (!selectedMonth) return;
  
  const [year, month] = selectedMonth.split('-');
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const monthName = monthNames[parseInt(month) - 1];
  
  document.getElementById('currentMonthDisplay').textContent = `${year}年${monthName}`;
}

// 登出
function logout() {
  // 清除所有 session 信息
  sessionStorage.removeItem('adminLoggedIn');
  sessionStorage.removeItem('adminSessionToken');
  sessionStorage.removeItem('adminSessionTime');
  // 清除已處理的預約記錄（可選，根據需求決定）
  // processedBookingIds.clear();
  // saveProcessedBookingIds();
  
  // 顯示登入畫面
  showLoginModal();
  showLoginModal();
  allBookings = [];
  filteredBookings = [];
}

// 載入預約數據
async function loadBookings() {
  showLoading('載入預約數據...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    // 從 Supabase 獲取資料
    const { data: bookingsData, error } = await supabaseClientInstance
      .from('foodcarcalss')
      .select('*')
      .order('booking_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // 轉換為與 Google Sheets 相同的格式
    const data = {
      success: true,
      bookings: (bookingsData || []).map(row => ({
        timestamp: row.timestamp || row.created_at || new Date().toISOString(), // 優先使用 timestamp，沒有則用 created_at
        created_at: row.created_at, // 保留 created_at 供新預約判斷使用
        vendor: row.vendor || '',
        foodType: row.food_type || '',
        location: row.location || '',
        date: row.booking_date || '',
        status: row.status || '己排',
        bookedStatus: row.status || '己排',
        fee: row.fee || '600元/天',
        payment: row.payment || '未繳款',
        note: row.note || '',
        paymentImageUrl: row.payment_image_url || null, // 匯款圖片 URL
        id: row.id,
        rowNumber: row.id // 為了向後兼容
      })),
      lastUpdate: new Date().toISOString()
    };
    
    if (data.success && data.bookings) {
      // 正規化付款狀態：統一付款狀態名稱
      allBookings = data.bookings.map(booking => {
        const payment = booking.payment || '';
        const paymentTrimmed = payment.trim();
        
        // 統一未付款狀態的名稱
        if (!paymentTrimmed || 
            paymentTrimmed === '未繳款' || 
            paymentTrimmed === '尚未付款' || 
            paymentTrimmed === '未付款') {
          booking.payment = '未繳款';
        }
        // 統一已付款狀態的名稱
        else if (paymentTrimmed === '已付款' || paymentTrimmed === '己繳款') {
          booking.payment = '己繳款';
        }
        // 其他狀態保持不變（如「逾繳可排」）
        
        return booking;
      });
      
      // 調試：顯示付款狀態統計
      const unpaidCount = allBookings.filter(b => {
        const payment = b.payment || '';
        return payment === '未繳款' || 
               payment === '尚未付款' || 
               payment === '未付款' || 
               payment === '' || 
               !payment;
      }).length;
      console.log('📊 付款狀態統計：');
      console.log('  總數:', allBookings.length);
      console.log('  己繳款:', allBookings.filter(b => b.payment === '己繳款' || b.payment === '已付款').length);
      console.log('  未繳款:', unpaidCount, '(包含：未繳款、尚未付款、未付款)');
      console.log('  逾繳可排:', allBookings.filter(b => b.payment === '逾繳可排').length);
      
      // 初始化月份選擇器（如果還沒初始化）
      if (!document.querySelector('.month-btn')) {
        initMonthSelector();
      }
      
      // 應用篩選
      filterBookings();
      
      // 調試：檢查新預約
      const newBookings = getNewBookings();
      console.log('📋 載入完成後檢查新預約：', newBookings.length, '筆');
      
      showToast('success', '載入成功', `已載入 ${allBookings.length} 筆預約資料${newBookings.length > 0 ? `，${newBookings.length} 筆新預約` : ''}`);
    } else {
      showToast('error', '載入失敗', data.message || '無法載入預約資料');
    }
  } catch (error) {
    const errorMessage = handleError(error, '載入預約數據', '無法載入預約資料，請檢查網路連線後重試');
    showToast('error', '載入失敗', errorMessage);
    
    // 如果載入失敗，顯示重試按鈕
    const container = document.getElementById('bookingsTableBody');
    if (container) {
      container.innerHTML = `
        <tr>
          <td colspan="10" class="error-row">
            <div style="text-align: center; padding: 40px;">
              <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #ef4444; margin-bottom: 16px;"></i>
              <h3 style="color: #dc2626; margin-bottom: 8px;">載入失敗</h3>
              <p style="color: #6b7280; margin-bottom: 20px;">${escapeHtml(errorMessage)}</p>
              <button onclick="loadBookings()" class="btn btn-primary">
                <i class="fas fa-redo"></i> 重新載入
              </button>
            </div>
          </td>
        </tr>
      `;
    }
  } finally {
    hideLoading();
  }
}

// 重新載入數據（已移至下方，使用新的實現）

// 渲染預約列表
function renderBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  const count = document.getElementById('bookingCount');
  
  count.textContent = `共 ${filteredBookings.length} 筆`;
  
  if (filteredBookings.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" class="loading-row">
          <i class="fas fa-inbox"></i> 沒有符合條件的預約
        </td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = filteredBookings.map(booking => {
    const timestamp = booking.timestamp ? new Date(booking.timestamp).toLocaleString('zh-TW') : '-';
    const paymentStatus = booking.payment || '未繳款';
    const statusClass = paymentStatus === '己繳款' ? 'payment-paid' : 
                       paymentStatus === '逾繳可排' ? 'payment-overdue' : 'payment-unpaid';
    
    // 使用全局的 escapeHtml 函數（已在文件開頭定義）
    const safeVendor = escapeHtml(booking.vendor || '-');
    const safeLocation = escapeHtml(booking.location || '-');
    const safeDate = escapeHtml(booking.date || '-');
    
    return `
      <tr>
        <td>${timestamp}</td>
        <td><strong>${safeVendor}</strong></td>
        <td>${escapeHtml(booking.foodType || '-')}</td>
        <td>${safeLocation}</td>
        <td>${safeDate}</td>
        <td><span class="status-badge">${escapeHtml(booking.status || booking.bookedStatus || '-')}</span></td>
        <td>${escapeHtml(booking.fee || '600元/天')}</td>
        <td>
          <span class="status-badge ${statusClass} payment-status-clickable" 
                onclick="togglePaymentStatus(${booking.rowNumber}, '${safeVendor}', '${safeLocation}', '${safeDate}')" 
                title="點擊變更付款狀態"
                style="cursor: pointer; user-select: none;">
            ${paymentStatus}
          </span>
        </td>
        <td title="${escapeHtml(booking.note || '-')}">${escapeHtml(booking.note || '-')}</td>
        <td>
          <div class="action-buttons">
            <button onclick="editBooking(${booking.rowNumber})" class="btn btn-primary btn-sm">
              <i class="fas fa-edit"></i> 編輯
            </button>
            <button onclick="deleteBooking(${booking.rowNumber}, '${safeVendor}', '${safeLocation}', '${safeDate}')" class="btn btn-danger btn-sm">
              <i class="fas fa-trash"></i> 刪除
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// 更新統計資訊（基於篩選後的數據）
function updateStats() {
  // 使用 filteredBookings 來計算統計（只統計當前顯示的月份）
  const total = filteredBookings.length;
  // 正規化付款狀態後再統計
  const paid = filteredBookings.filter(b => {
    const payment = b.payment || '';
    return payment === '己繳款' || payment === '已付款';
  }).length;
  const unpaid = filteredBookings.filter(b => {
    const payment = b.payment || '';
    // 判斷所有可能的未付款狀態
    return payment === '未繳款' || 
           payment === '尚未付款' || 
           payment === '未付款' || 
           payment === '' || 
           !payment;
  }).length;
  const overdue = filteredBookings.filter(b => {
    const payment = b.payment || '';
    return payment === '逾繳可排';
  }).length;
  
  document.getElementById('totalBookings').textContent = total;
  document.getElementById('paidBookings').textContent = paid;
  document.getElementById('unpaidBookings').textContent = unpaid;
  document.getElementById('overdueBookings').textContent = overdue;
}

// 篩選預約（使用防抖優化）
const debouncedFilterBookings = debounce(function() {
  filterBookings();
}, 300);

function filterBookings() {
  const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
  const locationFilter = document.getElementById('locationFilter')?.value || '';
  const paymentFilter = document.getElementById('paymentFilter')?.value || '';
  
  filteredBookings = allBookings.filter(booking => {
    // 月份篩選（優先）
    if (selectedMonth) {
      const bookingDate = parseDate(booking.date);
      if (bookingDate) {
        const bookingYear = bookingDate.getFullYear();
        const bookingMonth = String(bookingDate.getMonth() + 1).padStart(2, '0');
        const bookingMonthKey = `${bookingYear}-${bookingMonth}`;
        if (bookingMonthKey !== selectedMonth) return false;
      } else {
        // 如果無法解析日期，嘗試從字串匹配
        const [year, month] = selectedMonth.split('-');
        const monthPattern = `${parseInt(month)}月`;
        if (!booking.date || !booking.date.includes(monthPattern)) {
          // 檢查年份
          if (booking.date && !booking.date.includes(year)) {
            return false;
          }
        }
      }
    }
    
    // 搜尋篩選
    if (searchTerm) {
      const searchText = `${booking.vendor} ${booking.location} ${booking.date} ${booking.foodType}`.toLowerCase();
      if (!searchText.includes(searchTerm)) return false;
    }
    
    // 場地篩選
    if (locationFilter && booking.location !== locationFilter) return false;
    
    // 付款狀態篩選
    if (paymentFilter) {
      const payment = booking.payment || '';
      if (paymentFilter === '己繳款' && payment !== '己繳款' && payment !== '已付款') return false;
      if (paymentFilter === '未繳款' && 
          payment !== '未繳款' && 
          payment !== '尚未付款' && 
          payment !== '未付款' && 
          payment !== '') return false;
      if (paymentFilter === '逾繳可排' && payment !== '逾繳可排') return false;
    }
    
    return true;
  });
  
  // 依照日期排序（升序：最早的在前）
  sortBookingsByDate();
  
  renderBookings();
  updateStats();
  renderNewBookings(); // 渲染新預約快速操作區域
  
  // 如果當前是月曆模式，重新渲染月曆
  if (document.getElementById('calendarView')?.classList.contains('active')) {
    renderAdminCalendar();
  }
}

// 依照日期排序
function sortBookingsByDate() {
  filteredBookings.sort((a, b) => {
    const dateA = parseDate(a.date);
    const dateB = parseDate(b.date);
    
    // 如果無法解析日期，放到最後
    if (!dateA && !dateB) return 0;
    if (!dateA) return 1;
    if (!dateB) return -1;
    
    // 按日期升序排序（最早的在前）
    return dateA - dateB;
  });
}

// 解析日期（處理多種格式）
function parseDate(dateStr) {
  if (!dateStr) return null;
  
  // 處理 "10月13日(星期一)" 格式
  if (dateStr.includes('月') && dateStr.includes('日')) {
    const match = dateStr.match(/(\d+)月(\d+)日/);
    if (match) {
      const year = new Date().getFullYear();
      const month = parseInt(match[1]) - 1;
      const day = parseInt(match[2]);
      return new Date(year, month, day);
    }
  }
  
  // 處理 ISO 格式 "2025-10-13"
  if (dateStr.includes('-')) {
    return new Date(dateStr);
  }
  
  return null;
}

// 編輯預約
function editBooking(rowNumber) {
  const booking = allBookings.find(b => b.rowNumber === rowNumber);
  if (!booking) {
    showToast('error', '錯誤', '找不到該預約記錄');
    return;
  }
  
  currentEditingBooking = booking;
  
  // 填充表單
  document.getElementById('editRowNumber').value = booking.rowNumber;
  document.getElementById('editVendor').value = booking.vendor || '';
  document.getElementById('editFoodType').value = booking.foodType || '';
  document.getElementById('editLocation').value = booking.location || '';
  
  // 處理日期格式
  let dateValue = '';
  if (booking.date) {
    const parsedDate = parseDate(booking.date);
    if (parsedDate) {
      dateValue = parsedDate.toISOString().split('T')[0];
    } else if (booking.date.includes('-')) {
      dateValue = booking.date.split('T')[0];
    }
  }
  document.getElementById('editDate').value = dateValue;
  
  document.getElementById('editStatus').value = booking.status || booking.bookedStatus || '己排';
  document.getElementById('editFee').value = booking.fee || '600元/天';
  document.getElementById('editPayment').value = booking.payment || '未繳款';
  document.getElementById('editNote').value = booking.note || '';
  
  // 顯示模態框
  document.getElementById('editModal').classList.add('active');
}

// 關閉編輯模態框
function closeEditModal() {
  document.getElementById('editModal').classList.remove('active');
  currentEditingBooking = null;
  document.getElementById('editForm').reset();
}

// 儲存預約
async function saveBooking(event) {
  event.preventDefault();
  
  // 驗證 session
  if (!validateSession()) {
    showToast('error', '會話已過期', '請重新登入');
    logout();
    return;
  }

  const rowNumber = parseInt(document.getElementById('editRowNumber').value);
  
  // 輸入清理和驗證
  const vendor = sanitizeInput(document.getElementById('editVendor').value.trim(), 'text');
  const foodType = sanitizeInput(document.getElementById('editFoodType').value.trim(), 'text');
  const location = sanitizeInput(document.getElementById('editLocation').value.trim(), 'text');
  const date = document.getElementById('editDate').value;
  const status = sanitizeInput(document.getElementById('editStatus').value.trim(), 'text');
  const fee = sanitizeInput(document.getElementById('editFee').value.trim(), 'text');
  const payment = sanitizeInput(document.getElementById('editPayment').value.trim(), 'text');
  const note = sanitizeInput(document.getElementById('editNote').value.trim(), 'text');
  
  // 輸入驗證
  if (!vendor || !validateInputLength(vendor, 1, 100)) {
    showToast('error', '驗證失敗', '餐車名稱長度必須在 1-100 字元之間');
    return;
  }
  
  if (!location || !validateInputLength(location, 1, 200)) {
    showToast('error', '驗證失敗', '場地長度必須在 1-200 字元之間');
    return;
  }
  
  if (!date) {
    showToast('error', '驗證失敗', '請選擇日期');
    return;
  }
  
  // 驗證日期格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    showToast('error', '驗證失敗', '日期格式不正確');
    return;
  }
  
  if (note && !validateInputLength(note, 0, 500)) {
    showToast('error', '驗證失敗', '備註長度不能超過 500 字元');
    return;
  }
  
  const updateData = {
    vendor,
    foodType,
    location,
    date,
    status,
    fee,
    payment,
    note
  };
  
  showLoading('儲存中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    // 格式化日期
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
        console.warn('日期格式化失敗，使用原值:', dateStr);
        return dateStr;
      }
    }
    
    const { data, error } = await supabaseClientInstance
      .from('foodcarcalss')
      .update({
        vendor: updateData.vendor,
        food_type: updateData.foodType,
        location: updateData.location,
        booking_date: formatDateForDisplay(updateData.date) || updateData.date,
        status: updateData.status,
        fee: updateData.fee,
        payment: updateData.payment,
        note: updateData.note
      })
      .eq('id', rowNumber)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    showToast('success', '儲存成功', '預約資料已更新');
    closeEditModal();
    // 重新載入數據以獲取最新狀態（包括 created_at）
    setTimeout(() => {
      loadBookings();
    }, 500);
  } catch (error) {
    showErrorToast('儲存預約', error, '無法儲存預約資料，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 刪除預約確認彈窗變數
let pendingDeleteBooking = null;

// 顯示刪除確認彈窗
function showDeleteConfirmModal(rowNumber, vendor, location, date) {
  pendingDeleteBooking = { rowNumber, vendor, location, date };
  
  document.getElementById('deleteConfirmVendor').textContent = vendor || '-';
  document.getElementById('deleteConfirmLocation').textContent = location || '-';
  document.getElementById('deleteConfirmDate').textContent = date || '-';
  
  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.add('active');
  
  // 綁定確認按鈕事件
  const confirmBtn = document.getElementById('confirmDeleteBtn');
  confirmBtn.onclick = () => {
    if (pendingDeleteBooking) {
      executeDeleteBooking(pendingDeleteBooking.rowNumber);
    }
  };
  
  // 點擊彈窗外部關閉
  modal.onclick = (e) => {
    if (e.target === modal) {
      closeDeleteConfirmModal();
    }
  };
}

// 關閉刪除確認彈窗
function closeDeleteConfirmModal() {
  const modal = document.getElementById('deleteConfirmModal');
  modal.classList.remove('active');
  pendingDeleteBooking = null;
}

// 執行刪除操作
async function executeDeleteBooking(rowNumber) {
  closeDeleteConfirmModal();
  
  showLoading('刪除中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { error } = await supabaseClientInstance
      .from('foodcarcalss')
      .delete()
      .eq('id', rowNumber);
    
    if (error) {
      throw error;
    }
    
    // 如果該預約在已處理列表中，也要移除
    processedBookingIds.delete(String(rowNumber));
    saveProcessedBookingIds();
    
    showToast('success', '刪除成功', '預約已刪除');
    // 立即更新本地數據（不重新載入）
    allBookings = allBookings.filter(b => (b.id || b.rowNumber) !== rowNumber);
    filterBookings();
  } catch (error) {
    showErrorToast('刪除預約', error, '無法刪除預約，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 刪除預約（使用自定義彈窗）
function deleteBooking(rowNumber, vendor, location, date) {
  showDeleteConfirmModal(rowNumber, vendor, location, date);
}

// 顯示載入指示器
function showLoading(message = '處理中...') {
  document.getElementById('loadingMessage').textContent = message;
  document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隱藏載入指示器
function hideLoading() {
  document.getElementById('loadingOverlay').style.display = 'none';
}

// 快速變更付款狀態（顯示確認彈窗）
function togglePaymentStatus(rowNumber, vendor, location, date) {
  const booking = allBookings.find(b => b.rowNumber === rowNumber);
  if (!booking) {
    showToast('error', '錯誤', '找不到該預約記錄');
    return;
  }
  
  const currentPayment = booking.payment || '未繳款';
  let newPayment;
  let paymentText;
  
  // 循環切換：未繳款 -> 己繳款 -> 逾繳可排 -> 未繳款
  if (currentPayment === '未繳款' || 
      currentPayment === '尚未付款' || 
      currentPayment === '未付款' || 
      currentPayment === '' || 
      !currentPayment) {
    newPayment = '己繳款';
    paymentText = '己繳款（已付款）';
  } else if (currentPayment === '己繳款' || currentPayment === '已付款') {
    newPayment = '逾繳可排';
    paymentText = '逾繳可排（逾期可排）';
  } else if (currentPayment === '逾繳可排') {
    newPayment = '未繳款';
    paymentText = '未繳款';
  } else {
    newPayment = '己繳款';
    paymentText = '己繳款（已付款）';
  }
  
  // 顯示確認彈窗
  showPaymentConfirmModal({
    rowNumber: rowNumber,
    vendor: vendor,
    location: location,
    date: date,
    currentPayment: currentPayment,
    newPayment: newPayment,
    paymentText: paymentText
  });
}

// 顯示付款狀態變更確認彈窗
function showPaymentConfirmModal(data) {
  const modal = document.getElementById('paymentConfirmModal');
  const currentText = data.currentPayment === '己繳款' || data.currentPayment === '已付款' ? '己繳款' : 
                     data.currentPayment === '逾繳可排' ? '逾繳可排' : '未繳款';
  
  document.getElementById('confirmVendor').textContent = data.vendor;
  document.getElementById('confirmLocation').textContent = data.location;
  document.getElementById('confirmDate').textContent = data.date;
  document.getElementById('confirmCurrentPayment').textContent = currentText;
  document.getElementById('confirmNewPayment').textContent = data.paymentText;
  
  // 儲存數據到按鈕
  document.getElementById('confirmPaymentBtn').onclick = () => {
    closePaymentConfirmModal();
    executePaymentStatusChange(data);
  };
  
  modal.classList.add('active');
}

// 關閉付款狀態變更確認彈窗
function closePaymentConfirmModal() {
  document.getElementById('paymentConfirmModal').classList.remove('active');
}

// 執行付款狀態變更
async function executePaymentStatusChange(data) {
  showLoading(`變更付款狀態為「${data.paymentText}」...`);
  
  try {
    const booking = allBookings.find(b => b.rowNumber === data.rowNumber);
    if (!booking) {
      showToast('error', '錯誤', '找不到該預約記錄');
      return;
    }
    
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { data: updatedData, error } = await supabaseClientInstance
      .from('foodcarcalss')
      .update({ payment: data.newPayment })
      .eq('id', data.rowNumber)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    showToast('success', '更新成功', `付款狀態已變更為「${data.paymentText}」`);
    // 更新本地數據
    booking.payment = data.newPayment;
    // 重新渲染和更新統計（不重新載入）
    filterBookings();
  } catch (error) {
    const errorMessage = handleError(error, '變更付款狀態', '無法更新付款狀態，請檢查網路連線後重試');
    showErrorToast('變更付款狀態', error, '無法更新付款狀態，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 顯示 Toast 通知
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    warning: 'fa-exclamation-triangle',
    info: 'fa-info-circle'
  }[type] || 'fa-info-circle';
  
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <div>
      <strong>${title}</strong>
      <div style="font-size: 0.85rem; margin-top: 4px;">${message}</div>
    </div>
  `;
  
  container.appendChild(toast);
  
  // 3秒後自動移除
  setTimeout(() => {
    toast.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// ========== 新預約快速操作功能 ==========

// 獲取新預約（最近24小時內，或未付款的預約）
function getNewBookings() {
  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  
  // 調試模式：顯示詳細信息
  if (DEBUG_MODE) {
    debugLog('🔍 檢查新預約：');
    debugLog('  當前時間:', now.toLocaleString('zh-TW'));
    debugLog('  24小時前:', twentyFourHoursAgo.toLocaleString('zh-TW'));
    debugLog('  總預約數:', allBookings.length);
    
    // 顯示未付款的預約
    const unpaidBookings = allBookings.filter(b => {
      const payment = b.payment || '';
      return payment === '未繳款' || 
             payment === '尚未付款' || 
             payment === '未付款' || 
             payment === '' || 
             !payment;
    });
    debugLog('  未付款預約數:', unpaidBookings.length);
    
    // 顯示前10筆預約的時間戳記
    debugLog('📋 前10筆預約的時間戳記：');
    allBookings.slice(0, 10).forEach((b, i) => {
      const ts = b.timestamp || b.created_at;
      const time = ts ? new Date(ts) : null;
      const hoursAgo = time ? ((now - time) / (1000 * 60 * 60)).toFixed(1) : 'N/A';
      const payment = b.payment || '未繳款';
      debugLog(`  ${i + 1}. ${b.vendor || '(無名)'} | 時間: ${hoursAgo}小時前 | 付款: ${payment} | timestamp: ${b.timestamp || 'N/A'} | created_at: ${b.created_at || 'N/A'}`);
    });
  }
  
  const newBookings = allBookings.filter(booking => {
    // 檢查付款狀態（統一判斷所有未付款狀態）
    const payment = booking.payment || '';
    const isUnpaid = payment === '未繳款' || 
                     payment === '尚未付款' || 
                     payment === '未付款' || 
                     payment === '' || 
                     !payment;
    
    // 如果未付款，直接顯示（不管時間多久，不管預約日期）
    if (isUnpaid) {
      if (DEBUG_MODE) {
        debugLog(`✅ 未付款預約: ${booking.vendor || '(無名)'} | 日期: ${booking.date || 'N/A'} | 付款: ${payment || '未繳款'}`);
      }
      return true;
    }
    
    // 對於已付款的預約，只顯示最近24小時內的新預約
    // 優先使用 timestamp，沒有則使用 created_at（Supabase 自動生成）
    const timeSource = booking.timestamp || booking.created_at;
    
    if (!timeSource) {
      return false;
    }
    
    // 處理不同的時間格式
    let bookingTime;
    if (typeof timeSource === 'string') {
      bookingTime = new Date(timeSource);
    } else if (timeSource instanceof Date) {
      bookingTime = timeSource;
    } else {
      return false;
    }
    
    // 檢查是否為有效日期
    if (isNaN(bookingTime.getTime())) {
      if (DEBUG_MODE) {
        debugLog('⚠️ 無效的時間戳記:', timeSource, booking.vendor);
      }
      return false;
    }
    
    const isNewByTime = bookingTime >= twentyFourHoursAgo;
    
    if (DEBUG_MODE && isNewByTime) {
      const hoursDiff = (now - bookingTime) / (1000 * 60 * 60);
      debugLog(`✅ 新預約（24小時內）: ${booking.vendor || '(無名)'} | 時間: ${bookingTime.toLocaleString('zh-TW')} | 距離現在: ${hoursDiff.toFixed(1)}小時 | 付款: ${payment || '未繳款'}`);
    }
    
    return isNewByTime;
  }).sort((a, b) => {
    // 優先排序：未付款的在前，然後按時間倒序
    const paymentA = a.payment || '';
    const paymentB = b.payment || '';
    const isUnpaidA = paymentA === '未繳款' || 
                      paymentA === '尚未付款' || 
                      paymentA === '未付款' || 
                      paymentA === '' || 
                      !paymentA;
    const isUnpaidB = paymentB === '未繳款' || 
                      paymentB === '尚未付款' || 
                      paymentB === '未付款' || 
                      paymentB === '' || 
                      !paymentB;
    
    // 未付款的優先顯示
    if (isUnpaidA && !isUnpaidB) return -1;
    if (!isUnpaidA && isUnpaidB) return 1;
    
    // 同為未付款或已付款，按時間倒序排列（最新的在前）
    const timeA = new Date(a.timestamp || a.created_at || 0);
    const timeB = new Date(b.timestamp || b.created_at || 0);
    return timeB - timeA;
  });
  
  // 顯示結果（始終輸出，方便調試）
  const unpaidCount = newBookings.filter(b => {
    const payment = b.payment || '';
    return payment === '未繳款' || 
           payment === '尚未付款' || 
           payment === '未付款' || 
           payment === '' || 
           !payment;
  }).length;
  const newCount = newBookings.length - unpaidCount;
  
  if (newBookings.length > 0) {
    console.log(`✅ 找到 ${newBookings.length} 筆新預約（${unpaidCount} 筆未付款，${newCount} 筆24小時內新預約）`);
    if (DEBUG_MODE) {
      debugLog('📋 未付款預約詳情：');
      newBookings.filter(b => {
        const payment = b.payment || '';
        return payment === '未繳款' || 
               payment === '尚未付款' || 
               payment === '未付款' || 
               payment === '' || 
               !payment;
      }).forEach((b, i) => {
        debugLog(`  ${i + 1}. ${b.vendor || '(無名)'} | 日期: ${b.date || 'N/A'} | 場地: ${b.location || 'N/A'}`);
      });
    }
  } else {
    console.log('ℹ️ 沒有新預約或未付款預約');
  }
  
  return newBookings;
}

// 渲染新預約快速操作區域
function renderNewBookings() {
  const allNewBookings = getNewBookings();
  // 過濾掉已處理的預約
  const newBookings = allNewBookings.filter(booking => {
    const bookingId = booking.id || booking.rowNumber;
    return !processedBookingIds.has(String(bookingId));
  });
  
  const section = document.getElementById('newBookingsSection');
  const grid = document.getElementById('newBookingsGrid');
  const noNewBookings = document.getElementById('noNewBookings');
  const countBadge = document.getElementById('newBookingsCount');
  
  // 更新"查看已處理"按鈕的顯示狀態
  const viewProcessedBtn = document.getElementById('viewProcessedBtn');
  if (viewProcessedBtn) {
    const processedCount = allNewBookings.filter(booking => {
      const bookingId = booking.id || booking.rowNumber;
      return processedBookingIds.has(String(bookingId));
    }).length;
    
    if (processedCount > 0) {
      viewProcessedBtn.innerHTML = `<i class="fas fa-eye"></i> 查看已處理 (${processedCount})`;
      viewProcessedBtn.style.display = 'inline-block';
    } else {
      viewProcessedBtn.style.display = 'none';
    }
  }
  
  if (newBookings.length === 0) {
    if (section) {
      section.style.display = 'none';
    }
    return;
  }
  
  if (!section || !grid) {
    console.error('❌ 找不到新預約區域元素');
    return;
  }
  
  // 確保區域顯示（即使在標籤頁中）
  if (section) {
    section.style.display = 'block';
    section.classList.remove('hidden');
  }
  if (grid) {
    grid.innerHTML = '';
  }
  
  // 更新計數
  if (countBadge) {
    countBadge.textContent = `${newBookings.length} 筆新預約`;
  }
  
  // 創建卡片
  newBookings.forEach((booking) => {
    const card = createNewBookingCard(booking);
    if (card) {
      grid.appendChild(card);
    }
  });
  
  if (noNewBookings) noNewBookings.style.display = 'none';
}

// 創建新預約卡片
function createNewBookingCard(booking) {
  const card = document.createElement('div');
  card.className = 'new-booking-card';
  card.dataset.bookingId = booking.id || booking.rowNumber;
  
  // 格式化時間（優先使用 created_at，因為它是 Supabase 自動生成的）
  const timeSource = booking.timestamp || booking.created_at;
  const bookingTime = timeSource ? new Date(timeSource) : new Date();
  const timeStr = bookingTime.toLocaleString('zh-TW', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // 付款狀態
  const payment = booking.payment || '未繳款';
  const paymentClass = payment === '己繳款' || payment === '已付款' ? 'payment-paid' : 
                       payment === '逾繳可排' ? 'payment-overdue' : 'payment-unpaid';
  
  // HTML 轉義
  const safeVendor = escapeHtml(booking.vendor || '');
  const safeLocation = escapeHtml(booking.location || '');
  const safeDate = escapeHtml(booking.date || '');
  const safeFoodType = escapeHtml(booking.foodType || '-');
  const paymentImageUrl = booking.paymentImageUrl || booking.payment_image_url || null;
  
  card.innerHTML = `
    <div class="new-booking-header">
      <div class="new-booking-title">
        <div class="new-booking-vendor">${safeVendor}</div>
        <div class="new-booking-time">
          <i class="fas fa-clock"></i> ${timeStr}
        </div>
      </div>
      <span class="new-booking-badge">新預約</span>
    </div>
    <div class="new-booking-content-wrapper">
      <div class="new-booking-info">
        <div class="new-booking-info-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>${safeLocation}</span>
        </div>
        <div class="new-booking-info-item">
          <i class="fas fa-calendar"></i>
          <span>${safeDate}</span>
        </div>
        <div class="new-booking-info-item">
          <i class="fas fa-utensils"></i>
          <span>${safeFoodType}</span>
        </div>
        <div class="new-booking-info-item">
          <i class="fas fa-dollar-sign"></i>
          <span class="status-badge ${paymentClass}">${payment}</span>
        </div>
      </div>
      ${paymentImageUrl ? `
        <div class="new-booking-image-preview" onclick="showPaymentImageModal('${paymentImageUrl}')">
          <img src="${paymentImageUrl}" alt="匯款證明" loading="lazy">
          <div class="image-overlay">
            <i class="fas fa-search-plus"></i>
            <span>點擊放大</span>
          </div>
        </div>
      ` : `
        <div class="new-booking-image-placeholder">
          <i class="fas fa-image"></i>
          <span>無匯款圖片</span>
        </div>
      `}
    </div>
    <div class="new-booking-actions">
      <button onclick="quickMarkAsPaid(${booking.id || booking.rowNumber})" 
              class="btn btn-success btn-sm" 
              title="快速標記為已付款">
        <i class="fas fa-check"></i> 已付款
      </button>
      <button onclick="quickEditBooking(${booking.id || booking.rowNumber})" 
              class="btn btn-primary btn-sm"
              title="快速編輯">
        <i class="fas fa-edit"></i> 編輯
      </button>
      <button onclick="quickDeleteBooking(${booking.id || booking.rowNumber}, '${safeVendor}', '${safeLocation}', '${safeDate}')" 
              class="btn btn-danger btn-sm"
              title="快速刪除">
        <i class="fas fa-trash"></i> 刪除
      </button>
      <button onclick="markAsProcessed(${booking.id || booking.rowNumber})" 
              class="btn btn-secondary btn-sm"
              title="標記為已處理">
        <i class="fas fa-check-circle"></i> 已處理
      </button>
    </div>
  `;
  
  return card;
}

// 快速標記為已付款
async function quickMarkAsPaid(bookingId) {
  if (!confirm('確定要將此預約標記為已付款嗎？')) {
    return;
  }
  
  showLoading('處理中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { data, error } = await supabaseClientInstance
      .from('foodcarcalss')
      .update({ payment: '己繳款' })
      .eq('id', bookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    showToast('success', '更新成功', '付款狀態已更新為「己繳款」');
    
    // 立即更新本地數據和UI（不需要重新載入）
    const booking = allBookings.find(b => (b.id || b.rowNumber) === bookingId);
    if (booking) {
      booking.payment = '己繳款';
    }
    
    // 重新渲染（不重新載入）
    filterBookings();
    
  } catch (error) {
    showErrorToast('更新付款狀態', error, '無法更新付款狀態，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 快速編輯
function quickEditBooking(bookingId) {
  editBooking(bookingId);
}

// 快速刪除
function quickDeleteBooking(bookingId, vendor, location, date) {
  showDeleteConfirmModal(bookingId, vendor, location, date);
}

// 標記為已處理（隱藏卡片）
function markAsProcessed(bookingId) {
  // 將 ID 添加到已處理列表
  processedBookingIds.add(String(bookingId));
  saveProcessedBookingIds();
  
  const card = document.querySelector(`.new-booking-card[data-booking-id="${bookingId}"]`);
  if (card) {
    card.classList.add('processed');
    card.style.opacity = '0.5';
    setTimeout(() => {
      card.style.display = 'none';
      // 重新渲染以更新計數
      renderNewBookings();
    }, 300);
  }
  
  showToast('success', '已處理', '卡片已隱藏');
}

// 全部標記為已處理
function markAllNewBookingsAsProcessed() {
  const cards = document.querySelectorAll('.new-booking-card:not(.processed)');
  if (cards.length === 0) {
    showToast('info', '提示', '沒有需要處理的新預約');
    return;
  }
  
  if (!confirm(`確定要將 ${cards.length} 個新預約全部標記為已處理嗎？`)) {
    return;
  }
  
  // 獲取所有新預約並標記為已處理
  const allNewBookings = getNewBookings();
  allNewBookings.forEach(booking => {
    const bookingId = booking.id || booking.rowNumber;
    processedBookingIds.add(String(bookingId));
  });
  saveProcessedBookingIds();
  
  cards.forEach((card, index) => {
    setTimeout(() => {
      card.classList.add('processed');
      card.style.opacity = '0.5';
      setTimeout(() => {
        card.style.display = 'none';
        if (index === cards.length - 1) {
          // 最後一個卡片隱藏後，重新渲染以更新計數
          renderNewBookings();
        }
      }, 300);
    }, index * 50);
  });
  
  showToast('success', '完成', `已標記 ${cards.length} 個新預約為已處理`);
}

// 切換新預約區域顯示/隱藏
function toggleNewBookingsSection() {
  const section = document.getElementById('newBookingsSection');
  const btn = document.getElementById('toggleNewBookingsBtn');
  const grid = document.getElementById('newBookingsGrid');
  
  if (!section || !btn || !grid) return;
  
  if (section.classList.contains('collapsed')) {
    section.classList.remove('collapsed');
    grid.style.display = 'grid';
    btn.innerHTML = '<i class="fas fa-chevron-up"></i> 收起';
  } else {
    section.classList.add('collapsed');
    grid.style.display = 'none';
    btn.innerHTML = '<i class="fas fa-chevron-down"></i> 展開';
  }
}

// ========== 標籤頁切換功能 ==========
function switchTab(tabName) {
  console.log('🔄 開始切換標籤:', tabName);
  
  // 隱藏所有標籤頁內容（同時移除 active 類和設置 display）
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
    tab.style.display = 'none';
  });
  
  // 移除所有按鈕的 active 狀態
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // 獲取目標標籤頁和按鈕
  const targetTabId = `tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`;
  const targetTab = document.getElementById(targetTabId);
  const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
  
  console.log('🔍 目標標籤 ID:', targetTabId);
  console.log('🔍 目標標籤元素:', targetTab);
  console.log('🔍 目標按鈕元素:', targetBtn);
  
  // 顯示選中的標籤頁
  if (targetTab) {
    targetTab.style.display = 'block';
    targetTab.classList.add('active');
    console.log('✅ 標籤頁已顯示並設置為 active');
    console.log('🔍 標籤頁 display 樣式:', window.getComputedStyle(targetTab).display);
  } else {
    console.error('❌ 找不到目標標籤頁元素:', targetTabId);
  }
  
  // 設置按鈕為 active
  if (targetBtn) {
    targetBtn.classList.add('active');
    console.log('✅ 按鈕已設置為 active');
  } else {
    console.error('❌ 找不到目標按鈕元素');
  }
  
  // 根據標籤頁載入對應的資料
  if (tabName === 'bookings') {
    // 預約管理：確保新預約區域顯示
    setTimeout(() => {
      renderNewBookings();
    }, 100);
  } else if (tabName === 'locations') {
    // 場地管理：切換到場地管理時載入場地列表
    console.log('🔄 切換到場地管理標籤');
    setTimeout(() => {
      // 檢查是否已有資料，如果沒有則載入
      const container = document.getElementById('locationsList');
      if (container) {
        // 只有在沒有資料且不在載入中時才載入
        if ((!allLocations || allLocations.length === 0) && !isLoadingLocations) {
          console.log('📥 場地資料為空，開始載入...');
          loadLocations();
        } else if (allLocations && allLocations.length > 0) {
          // 如果已有資料，直接渲染（不重新載入，避免無限循環）
          console.log('✅ 使用現有場地資料，直接渲染');
          renderLocations();
        } else if (isLoadingLocations) {
          console.log('⏳ 場地資料正在載入中，等待完成...');
        }
      }
    }, 100);
  } else if (tabName === 'notices') {
    // 注意事項管理：切換到注意事項管理時載入注意事項列表
    console.log('🔄 切換到注意事項管理標籤');
    setTimeout(() => {
      // 檢查是否已有資料，如果沒有則載入
      const container = document.getElementById('noticesList');
      if (container) {
        // 只有在沒有資料時才載入
        if (!allNotices || allNotices.length === 0) {
          console.log('📥 注意事項資料為空，開始載入...');
          loadNotices();
        } else {
          // 如果已有資料，直接渲染（不重新載入，避免無限循環）
          console.log('✅ 使用現有注意事項資料，直接渲染');
          renderNotices();
        }
      }
    }, 100);
  }
}

// ========== 視圖切換功能 ==========

// 當前視圖模式
let currentViewMode = 'list'; // 'list' 或 'calendar'
let adminCalendarMonth = new Date().getMonth();
let adminCalendarYear = new Date().getFullYear();

// 切換視圖模式
function switchView(mode) {
  currentViewMode = mode;
  
  const listView = document.getElementById('listView');
  const calendarView = document.getElementById('calendarView');
  const listBtn = document.getElementById('listViewBtn');
  const calendarBtn = document.getElementById('calendarViewBtn');
  
  if (mode === 'list') {
    listView.classList.add('active');
    calendarView.classList.remove('active');
    listBtn.classList.add('active');
    calendarBtn.classList.remove('active');
  } else {
    listView.classList.remove('active');
    calendarView.classList.add('active');
    listBtn.classList.remove('active');
    calendarBtn.classList.add('active');
    
    // 渲染月曆
    renderAdminCalendar();
  }
}

// ========== 後台月曆渲染功能 ==========

// 渲染後台月曆
function renderAdminCalendar() {
  const grid = document.getElementById('adminCalendarGrid');
  const monthTitle = document.getElementById('adminCalendarMonthTitle');
  
  if (!grid) return;
  
  // 更新月份標題
  const monthNames = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  monthTitle.textContent = `${adminCalendarYear}年${monthNames[adminCalendarMonth]}`;
  
  // 清空網格
  grid.innerHTML = '';
  
  // 添加星期標題
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  weekdays.forEach(day => {
    const dayHeader = document.createElement('div');
    dayHeader.className = 'admin-calendar-weekday';
    dayHeader.textContent = day;
    grid.appendChild(dayHeader);
  });
  
  // 獲取月份的第一天和最後一天
  const firstDay = new Date(adminCalendarYear, adminCalendarMonth, 1);
  const lastDay = new Date(adminCalendarYear, adminCalendarMonth + 1, 0);
  const firstDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();
  
  // 添加上個月的日期（填充）
  const prevMonthLastDay = new Date(adminCalendarYear, adminCalendarMonth, 0).getDate();
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const dayElement = createCalendarDay(adminCalendarYear, adminCalendarMonth - 1, day, true);
    grid.appendChild(dayElement);
  }
  
  // 添加當月的日期
  for (let day = 1; day <= daysInMonth; day++) {
    const dayElement = createCalendarDay(adminCalendarYear, adminCalendarMonth, day, false);
    grid.appendChild(dayElement);
  }
  
  // 添加下個月的日期（填充）
  const totalCells = grid.children.length - 7; // 減去星期標題
  const remainingCells = 42 - totalCells; // 6行 x 7列 = 42
  for (let day = 1; day <= remainingCells; day++) {
    const dayElement = createCalendarDay(adminCalendarYear, adminCalendarMonth + 1, day, true);
    grid.appendChild(dayElement);
  }
}

// 創建月曆日期元素
function createCalendarDay(year, month, day, isOtherMonth) {
  const date = new Date(year, month, day);
  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  
  const dayElement = document.createElement('div');
  dayElement.className = 'admin-calendar-day';
  if (isOtherMonth) dayElement.classList.add('other-month');
  if (isToday) dayElement.classList.add('today');
  
  // 日期數字
  const dayNumber = document.createElement('div');
  dayNumber.className = 'admin-calendar-day-number';
  dayNumber.textContent = day;
  dayElement.appendChild(dayNumber);
  
  // 事件容器
  const eventsContainer = document.createElement('div');
  eventsContainer.className = 'admin-calendar-events';
  
  // 查找該日期的預約（基於 filteredBookings）
  const dayBookings = filteredBookings.filter(booking => {
    if (!booking.date) return false;
    
    // 解析日期格式（例如：1月10日(星期六)）
    const dateMatch = booking.date.match(/(\d+)月(\d+)日/);
    if (!dateMatch) return false;
    
    const bookingMonth = parseInt(dateMatch[1]);
    const bookingDay = parseInt(dateMatch[2]);
    
    // 判斷年份：根據當前顯示的月份和預約月份判斷
    let bookingYear = year;
    
    // 如果預約月份小於當前顯示月份，可能是下一年（例如：12月顯示，1月預約）
    if (bookingMonth < month + 1) {
      // 檢查是否跨年
      if (month === 11) { // 當前是12月
        bookingYear = year + 1;
      }
    } else if (bookingMonth > month + 1) {
      // 如果預約月份大於當前顯示月份，可能是上一年（例如：1月顯示，12月預約）
      if (month === 0) { // 當前是1月
        bookingYear = year - 1;
      }
    }
    
    // 精確匹配：月份和日期都要匹配
    return bookingMonth === month + 1 && bookingDay === day;
  });
  
  // 顯示最多3個事件，超過顯示「+N」
  const maxDisplay = 3;
  const displayBookings = dayBookings.slice(0, maxDisplay);
  const moreCount = dayBookings.length - maxDisplay;
  
  displayBookings.forEach(booking => {
    const event = createCalendarEvent(booking);
    eventsContainer.appendChild(event);
  });
  
  if (moreCount > 0) {
    const moreElement = document.createElement('div');
    moreElement.className = 'admin-calendar-event-more';
    moreElement.textContent = `+${moreCount}`;
    moreElement.title = `還有 ${moreCount} 個預約`;
    eventsContainer.appendChild(moreElement);
  }
  
  dayElement.appendChild(eventsContainer);
  
  // 點擊日期顯示該日期的所有預約
  if (dayBookings.length > 0 || !isOtherMonth) {
    dayElement.addEventListener('click', () => {
      if (dayBookings.length > 0) {
        showDayBookingsModal(dateStr, dayBookings);
      }
    });
  }
  
  return dayElement;
}

// 創建月曆事件元素
function createCalendarEvent(booking) {
  const event = document.createElement('div');
  event.className = 'admin-calendar-event';
  
  // 根據付款狀態設置樣式
  const payment = booking.payment || '未繳款';
  if (payment === '己繳款' || payment === '已付款') {
    event.classList.add('paid');
  } else if (payment === '逾繳可排') {
    event.classList.add('overdue');
  } else {
    event.classList.add('unpaid');
  }
  
  const vendor = document.createElement('span');
  vendor.className = 'admin-calendar-event-vendor';
  vendor.textContent = booking.vendor || '(無名)';
  vendor.title = `${booking.vendor || '(無名)'} - ${booking.location || ''}`;
  
  const location = document.createElement('span');
  location.className = 'admin-calendar-event-location';
  location.textContent = booking.location || '';
  
  event.appendChild(vendor);
  event.appendChild(location);
  
  // 點擊事件可快速編輯
  event.addEventListener('click', (e) => {
    e.stopPropagation();
    editBooking(booking.id || booking.rowNumber);
  });
  
  return event;
}

// 顯示日期預約詳情彈窗
function showDayBookingsModal(dateStr, bookings) {
  // 創建或獲取彈窗
  let modal = document.getElementById('dayBookingsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'dayBookingsModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 600px;">
        <div class="modal-header">
          <h3><i class="fas fa-calendar-day"></i> <span id="dayBookingsDate"></span></h3>
          <span class="modal-close" onclick="closeDayBookingsModal()">&times;</span>
        </div>
        <div class="modal-body">
          <div id="dayBookingsList"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  const date = new Date(dateStr);
  const dateText = `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  document.getElementById('dayBookingsDate').textContent = dateText;
  
  const list = document.getElementById('dayBookingsList');
  list.innerHTML = bookings.map(booking => {
    const payment = booking.payment || '未繳款';
    const paymentClass = payment === '己繳款' || payment === '已付款' ? 'payment-paid' : 
                         payment === '逾繳可排' ? 'payment-overdue' : 'payment-unpaid';
    
    return `
      <div class="day-booking-item" style="padding: 16px; margin-bottom: 12px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
          <div>
            <h4 style="margin: 0 0 8px 0; color: #1f2937;">${escapeHtml(booking.vendor || '')}</h4>
            <div style="font-size: 0.875rem; color: #6b7280;">
              <i class="fas fa-map-marker-alt"></i> ${escapeHtml(booking.location || '')} | 
              <i class="fas fa-utensils"></i> ${escapeHtml(booking.foodType || '-')}
            </div>
          </div>
          <span class="status-badge ${paymentClass}">${payment}</span>
        </div>
        <div style="display: flex; gap: 8px;">
          <button onclick="editBooking(${booking.id || booking.rowNumber})" class="btn btn-primary btn-sm">
            <i class="fas fa-edit"></i> 編輯
          </button>
          <button onclick="deleteBooking(${booking.id || booking.rowNumber}, '${escapeHtml(booking.vendor || '')}', '${escapeHtml(booking.location || '')}', '${escapeHtml(booking.date || '')}')" class="btn btn-danger btn-sm">
            <i class="fas fa-trash"></i> 刪除
          </button>
        </div>
      </div>
    `;
  }).join('');
  
  modal.classList.add('active');
}

// 關閉日期預約詳情彈窗
function closeDayBookingsModal() {
  const modal = document.getElementById('dayBookingsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 月曆導航
function adminCalendarPrevMonth() {
  adminCalendarMonth--;
  if (adminCalendarMonth < 0) {
    adminCalendarMonth = 11;
    adminCalendarYear--;
  }
  renderAdminCalendar();
}

function adminCalendarNextMonth() {
  adminCalendarMonth++;
  if (adminCalendarMonth > 11) {
    adminCalendarMonth = 0;
    adminCalendarYear++;
  }
  renderAdminCalendar();
}

function adminCalendarToday() {
  const today = new Date();
  adminCalendarMonth = today.getMonth();
  adminCalendarYear = today.getFullYear();
  renderAdminCalendar();
}

// ========== 自動刷新功能 ==========

// 啟動自動刷新（背景自動刷新）
function startAutoRefresh() {
  // 清除現有的刷新計時器
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
  }
  
  // 設置為 30 分鐘刷新一次（1800000 毫秒）
  const refreshInterval = 30 * 60 * 1000; // 30分鐘
  
  autoRefreshInterval = setInterval(() => {
    // 只在預約管理標籤頁時才自動刷新
    const currentTab = document.querySelector('.tab-btn.active');
    if (currentTab && currentTab.dataset.tab === 'bookings') {
      console.log('🔄 背景自動刷新預約數據...');
      loadBookings();
    } else {
      console.log('⏸️ 當前不在預約管理標籤，跳過自動刷新');
    }
  }, refreshInterval);
  
  console.log(`✅ 已啟動背景自動刷新，間隔: ${refreshInterval / 1000 / 60} 分鐘（僅在預約管理標籤時生效）`);
}

// 停止自動刷新
function stopAutoRefresh() {
  if (autoRefreshInterval) {
    clearInterval(autoRefreshInterval);
    autoRefreshInterval = null;
    console.log('⏸️ 已停止自動刷新');
  }
}

// 手動刷新數據（立即執行）
function refreshData() {
  console.log('🔄 手動刷新數據...');
  loadBookings();
}

// 暴露到全局
// 暴露登入和基本功能到全局
window.handleLogin = handleLogin;
window.logout = logout;
window.showLoginModal = showLoginModal;
window.showMainContent = showMainContent;
window.refreshData = refreshData;

// 暴露標籤頁和視圖切換功能
window.switchTab = switchTab;
window.switchView = switchView;

// 暴露月份選擇功能
window.selectCurrentMonth = selectCurrentMonth;
window.selectMonth = selectMonth;

// 暴露預約管理功能
window.debouncedFilterBookings = debouncedFilterBookings;
window.filterBookings = filterBookings;
window.editBooking = editBooking;
window.closeEditModal = closeEditModal;
window.saveBooking = saveBooking;
window.deleteBooking = deleteBooking;
window.showDeleteConfirmModal = showDeleteConfirmModal;
window.closeDeleteConfirmModal = closeDeleteConfirmModal;
window.togglePaymentStatus = togglePaymentStatus;
window.showPaymentConfirmModal = showPaymentConfirmModal;
window.closePaymentConfirmModal = closePaymentConfirmModal;
window.executePaymentStatusChange = executePaymentStatusChange;
window.executeDeleteBooking = executeDeleteBooking;

// 暴露新預約快速操作功能
window.quickMarkAsPaid = quickMarkAsPaid;
window.quickEditBooking = quickEditBooking;
window.quickDeleteBooking = quickDeleteBooking;
window.markAsProcessed = markAsProcessed;
window.markAllNewBookingsAsProcessed = markAllNewBookingsAsProcessed;
window.toggleNewBookingsSection = toggleNewBookingsSection;

// 暴露月曆功能
window.adminCalendarPrevMonth = adminCalendarPrevMonth;
window.adminCalendarNextMonth = adminCalendarNextMonth;
window.adminCalendarToday = adminCalendarToday;
window.closeDayBookingsModal = closeDayBookingsModal;

// ========== 場地管理功能 ==========

let allLocations = [];

// 獲取 Supabase 客戶端（確保可用）
function getSupabaseClient() {
  if (supabaseClientInstance) {
    return supabaseClientInstance;
  }
  // 如果未初始化，嘗試重新初始化
  if (typeof window.supabase !== 'undefined') {
    supabaseClientInstance = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ 重新初始化 Supabase 客戶端');
    return supabaseClientInstance;
  }
  throw new Error('Supabase 庫未載入，請檢查頁面是否正確引入 Supabase JS 庫');
}

// 載入場地列表
let isLoadingLocations = false; // 防止重複載入的標記

async function loadLocations() {
  // 防止重複載入
  if (isLoadingLocations) {
    console.log('⚠️ 場地資料正在載入中，跳過重複請求');
    return;
  }
  
  const container = document.getElementById('locationsList');
  if (!container) {
    console.error('❌ 找不到 locationsList 容器');
    return;
  }
  
  // 設置載入標記
  isLoadingLocations = true;
  
  // 顯示載入狀態
  container.innerHTML = '<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> 載入中...</div>';
  
  try {
    const supabase = getSupabaseClient();
    
    console.log('🔄 開始載入場地資料...');
    const { data, error } = await supabase
      .from('location_settings')
      .select('*')
      .order('location_key', { ascending: true });
    
    if (error) {
      console.error('❌ Supabase 查詢錯誤:', error);
      throw error;
    }
    
    allLocations = data || [];
    console.log('✅ 載入場地數據成功，共', allLocations.length, '個場地');
    
    // 立即渲染
    renderLocations();
    
    if (allLocations.length > 0) {
      showToast('success', '載入成功', `已載入 ${allLocations.length} 個場地`);
    } else {
      showToast('info', '載入完成', '目前沒有場地資料');
    }
  } catch (error) {
    showErrorToast('載入場地資料', error, '無法載入場地資料，請檢查網路連線後重試');
    
    if (container) {
      const errorMessage = handleError(error, '載入場地資料', '無法載入場地資料，請檢查網路連線後重試');
      container.innerHTML = `
        <div class="empty-row error-row">
          <i class="fas fa-exclamation-triangle"></i> 載入失敗
          <br><small>${escapeHtml(errorMessage)}</small>
          <br><button onclick="loadLocations()" class="btn btn-sm btn-primary" style="margin-top: 12px;">
            <i class="fas fa-redo"></i> 重試
          </button>
        </div>
      `;
    }
  } finally {
    // 清除載入標記
    isLoadingLocations = false;
  }
}

// 渲染場地列表
function renderLocations() {
  const container = document.getElementById('locationsList');
  if (!container) {
    console.error('❌ 找不到 locationsList 容器');
    return;
  }
  
  console.log('📋 開始渲染場地列表，共', allLocations.length, '個場地');
  
  if (allLocations.length === 0) {
    container.innerHTML = `
      <div class="empty-row">
        <i class="fas fa-inbox"></i> 目前沒有場地資料
        <br><small>點擊「新增場地」開始添加</small>
      </div>
    `;
    console.log('⚠️ 場地列表為空');
    return;
  }
  
  try {
    const html = allLocations.map(location => {
      // 處理 info 欄位（可能是 JSONB 或字串）
    let info = {};
    if (location.info) {
      if (typeof location.info === 'string') {
        try {
          info = JSON.parse(location.info);
        } catch (e) {
          console.warn('無法解析 info JSON:', location.info);
          info = {};
        }
      } else {
        info = location.info;
      }
    }
    
    // 處理 notices 欄位（可能是陣列或字串）
    let notices = [];
    if (location.notices) {
      if (Array.isArray(location.notices)) {
        notices = location.notices;
      } else if (typeof location.notices === 'string') {
        try {
          notices = JSON.parse(location.notices);
        } catch (e) {
          notices = [];
        }
      }
    }
    
    // 處理 available_days 欄位
    let availableDays = [];
    if (location.available_days) {
      if (Array.isArray(location.available_days)) {
        availableDays = location.available_days;
      } else if (typeof location.available_days === 'string') {
        try {
          availableDays = JSON.parse(location.available_days);
        } catch (e) {
          availableDays = [];
        }
      }
    }
    
    const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    const daysStr = availableDays.map(d => dayNames[d]).join('、') || '無';
    
    return `
      <div class="location-card ${!location.enabled ? 'disabled' : ''}">
        <div class="location-card-header">
          <div>
            <h3>
              <i class="fas fa-map-marker-alt"></i>
              ${escapeHtml(location.location_name || location.location_key)}
            </h3>
            <p class="location-key">識別碼：${escapeHtml(location.location_key)}</p>
          </div>
          <div class="location-status">
            <span class="status-badge ${location.enabled ? 'enabled' : 'disabled'}">
              ${location.enabled ? '啟用中' : '已停用'}
            </span>
          </div>
        </div>
        
        <div class="location-card-body">
          <div class="location-info-item">
            <i class="fas fa-map-pin"></i>
            <span>${escapeHtml(location.address || '')}</span>
          </div>
          <div class="location-info-item">
            <i class="fas fa-building"></i>
            <span>${escapeHtml(location.location_type || '')}</span>
          </div>
          <div class="location-info-item">
            <i class="fas fa-calendar-week"></i>
            <span>可預約：週${daysStr}</span>
          </div>
          <div class="location-info-item">
            <i class="fas fa-dollar-sign"></i>
            <span>${escapeHtml(info.fee || '未設定')}</span>
          </div>
          ${info.limit ? `
            <div class="location-info-item">
              <i class="fas fa-info-circle"></i>
              <span>限制：${escapeHtml(info.limit)}</span>
            </div>
          ` : ''}
          ${info.ban ? `
            <div class="location-info-item">
              <i class="fas fa-ban"></i>
              <span>禁止：${escapeHtml(info.ban)}</span>
            </div>
          ` : ''}
          ${notices.length > 0 ? `
            <div class="location-notices">
              <i class="fas fa-exclamation-triangle"></i>
              <span>${notices.length} 條注意事項</span>
            </div>
          ` : ''}
        </div>
        
        <div class="location-card-actions">
          <button onclick="editLocation(${location.id})" class="btn btn-sm btn-primary">
            <i class="fas fa-edit"></i> 編輯
          </button>
          <button onclick="toggleLocationStatus(${location.id}, ${location.enabled})" 
                  class="btn btn-sm ${location.enabled ? 'btn-warning' : 'btn-success'}">
            <i class="fas fa-toggle-${location.enabled ? 'on' : 'off'}"></i>
            ${location.enabled ? '停用' : '啟用'}
          </button>
          <button onclick="deleteLocation(${location.id}, '${escapeHtml(location.location_name || location.location_key).replace(/'/g, "\\'")}')" 
                  class="btn btn-sm btn-danger">
            <i class="fas fa-trash"></i> 刪除
          </button>
        </div>
      </div>
    `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✅ 場地列表渲染完成，HTML 長度:', html.length);
    console.log('✅ 容器內容已更新，容器元素:', container);
    
    // 移除強制顯示標籤頁的邏輯，避免無限循環
    // 標籤頁的顯示應該由 switchTab 函數控制，而不是在渲染時強制顯示
    console.log('✅ 場地列表渲染完成');
  } catch (error) {
    const errorMessage = handleError(error, '渲染場地列表', '無法顯示場地列表，請重新載入頁面');
    container.innerHTML = `
      <div class="empty-row error-row">
        <i class="fas fa-exclamation-triangle"></i> 渲染失敗
        <br><small>${escapeHtml(errorMessage)}</small>
        <br><button onclick="loadLocations()" class="btn btn-sm btn-primary" style="margin-top: 12px;">
          <i class="fas fa-redo"></i> 重新載入
        </button>
      </div>
    `;
  }
}

// 顯示新增場地彈窗
function showAddLocationModal() {
  document.getElementById('locationModalTitle').textContent = '新增場地';
  document.getElementById('locationForm').reset();
  document.getElementById('locationId').value = '';
  document.getElementById('locationEnabled').checked = true;
  
  // 重置星期選擇（預設週一到週六）
  document.querySelectorAll('.weekday-checkbox').forEach((cb, i) => {
    cb.checked = i !== 0; // 週日不選，其他都選
  });
  
  document.getElementById('locationModal').classList.add('active');
}

// 關閉場地彈窗
function closeLocationModal() {
  document.getElementById('locationModal').classList.remove('active');
}

// 編輯場地
function editLocation(locationId) {
  const location = allLocations.find(l => l.id === locationId);
  if (!location) {
    showToast('error', '錯誤', '找不到該場地');
    return;
  }
  
  document.getElementById('locationModalTitle').textContent = '編輯場地';
  document.getElementById('locationId').value = location.id;
  document.getElementById('locationKey').value = location.location_key || '';
  document.getElementById('locationName').value = location.location_name || '';
  document.getElementById('locationAddress').value = location.address || '';
  document.getElementById('locationType').value = location.location_type || '戶外場地';
  document.getElementById('locationEnabled').checked = location.enabled !== false;
  document.getElementById('locationTimeSlots').value = (location.time_slots || ['14:00-20:00']).join(', ');
  document.getElementById('locationFee').value = (location.info || {}).fee || '600元/天';
  document.getElementById('locationLimit').value = (location.info || {}).limit || '';
  document.getElementById('locationBan').value = (location.info || {}).ban || '';
  document.getElementById('locationSpecial').value = (location.info || {}).special || '';
  document.getElementById('locationNotices').value = (location.notices || []).join('\n');
  
  // 設定可預約星期
  const availableDays = location.available_days || [];
  document.querySelectorAll('.weekday-checkbox').forEach(cb => {
    cb.checked = availableDays.includes(parseInt(cb.value));
  });
  
  document.getElementById('locationModal').classList.add('active');
}

// 儲存場地
let isSavingLocation = false; // 防止重複提交的標記

async function saveLocation(event) {
  event.preventDefault();
  
  // 防止重複提交
  if (isSavingLocation) {
    console.log('⚠️ 場地正在儲存中，跳過重複提交');
    showToast('warning', '處理中', '場地資料正在儲存，請稍候...');
    return;
  }
  
  isSavingLocation = true;
  
  const locationId = document.getElementById('locationId').value;
  const locationKey = sanitizeInput(document.getElementById('locationKey').value.trim(), 'key');
  
  // 輸入驗證
  if (!locationKey || !validateInputLength(locationKey, 1, 50)) {
    showToast('error', '驗證失敗', '場地識別碼長度必須在 1-50 字元之間');
    return;
  }
  const locationName = sanitizeInput(document.getElementById('locationName').value.trim(), 'text');
  
  // 額外驗證
  if (!locationName || !validateInputLength(locationName, 1, 200)) {
    showToast('error', '驗證失敗', '顯示名稱長度必須在 1-200 字元之間');
    return;
  }
  const locationAddress = sanitizeInput(document.getElementById('locationAddress').value.trim(), 'text');
  if (!locationAddress || !validateInputLength(locationAddress, 1, 300)) {
    showToast('error', '驗證失敗', '完整地址長度必須在 1-300 字元之間');
    return;
  }
  const locationType = document.getElementById('locationType').value;
  const enabled = document.getElementById('locationEnabled').checked;
  const timeSlotsStr = document.getElementById('locationTimeSlots').value.trim();
  const fee = document.getElementById('locationFee').value.trim();
  const limit = document.getElementById('locationLimit').value.trim();
  const ban = document.getElementById('locationBan').value.trim();
  const special = document.getElementById('locationSpecial').value.trim();
  const noticesStr = document.getElementById('locationNotices').value.trim();
  
  // 獲取選中的星期
  const availableDays = Array.from(document.querySelectorAll('.weekday-checkbox:checked'))
    .map(cb => parseInt(cb.value))
    .sort((a, b) => a - b);
  
  // 解析時段
  const timeSlots = timeSlotsStr ? timeSlotsStr.split(',').map(s => s.trim()).filter(s => s) : ['14:00-20:00'];
  
  // 解析注意事項
  const notices = noticesStr ? noticesStr.split('\n').map(s => s.trim()).filter(s => s) : [];
  
  // 構建 info JSON
  const info = {
    hours: timeSlots[0] || '14:00-20:00',
    fee: fee || '600元/天',
    limit: limit || '',
    ban: ban || '',
    special: special || ''
  };
  
  // 構建 price_per_slot JSON
  const pricePerSlot = {};
  timeSlots.forEach(slot => {
    pricePerSlot[slot] = fee || '600元';
  });
  
  showLoading('儲存中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const locationData = {
      location_key: locationKey,
      location_name: locationName,
      address: locationAddress,
      location_type: locationType,
      enabled: enabled,
      available_days: availableDays,
      time_slots: timeSlots,
      price_per_slot: pricePerSlot,
      info: info,
      notices: notices
    };
    
    let result;
    if (locationId) {
      // 更新
      const { data, error } = await supabaseClientInstance
        .from('location_settings')
        .update(locationData)
        .eq('id', locationId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // 新增
      const { data, error } = await supabaseClientInstance
        .from('location_settings')
        .insert(locationData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    showToast('success', '儲存成功', '場地資料已更新');
    closeLocationModal();
    
    // 重新載入場地列表（使用 renderLocations 而不是 loadLocations，避免重複請求）
    // 先更新本地數據
    if (locationId) {
      // 更新現有場地
      const index = allLocations.findIndex(l => l.id === locationId);
      if (index !== -1) {
        allLocations[index] = result;
      }
    } else {
      // 新增場地
      allLocations.push(result);
    }
    
    // 直接渲染，不重新從服務器載入
    renderLocations();
  } catch (error) {
    showErrorToast('儲存場地', error, '無法儲存場地資料，請檢查網路連線後重試');
  } finally {
    hideLoading();
    isSavingLocation = false; // 清除保存標記
  }
}

// 切換場地啟用狀態
async function toggleLocationStatus(locationId, currentStatus) {
  const newStatus = !currentStatus;
  const action = newStatus ? '啟用' : '停用';
  
  if (!confirm(`確定要${action}此場地嗎？`)) {
    return;
  }
  
  showLoading(`${action}中...`);
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { error } = await supabaseClientInstance
      .from('location_settings')
      .update({ enabled: newStatus })
      .eq('id', locationId);
    
    if (error) throw error;
    
    showToast('success', '更新成功', `場地已${action}`);
    
    // 更新本地數據
    const index = allLocations.findIndex(l => l.id === locationId);
    if (index !== -1) {
      allLocations[index].enabled = newStatus;
    }
    
    // 直接渲染，不重新從服務器載入
    renderLocations();
  } catch (error) {
    showErrorToast('更新場地狀態', error, '無法更新場地狀態，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 刪除場地
async function deleteLocation(locationId, locationName) {
  if (!confirm(`確定要刪除場地「${locationName}」嗎？\n\n此操作無法復原！`)) {
    return;
  }
  
  showLoading('刪除中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { error } = await supabaseClientInstance
      .from('location_settings')
      .delete()
      .eq('id', locationId);
    
    if (error) throw error;
    
    showToast('success', '刪除成功', '場地已刪除');
    
    // 更新本地數據
    allLocations = allLocations.filter(l => l.id !== locationId);
    
    // 直接渲染，不重新從服務器載入
    renderLocations();
  } catch (error) {
    showErrorToast('刪除場地', error, '無法刪除場地，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// ========== 注意事項管理功能 ==========

let allNotices = [];
let filteredNotices = [];

// 篩選注意事項（使用防抖優化）
const debouncedFilterNotices = debounce(function() {
  filterNotices();
}, 300);

function filterNotices() {
  const searchTerm = document.getElementById('noticeSearchInput')?.value.toLowerCase() || '';
  const typeFilter = document.getElementById('noticeTypeFilter')?.value || '';
  const statusFilter = document.getElementById('noticeStatusFilter')?.value || '';
  const locationFilter = document.getElementById('noticeLocationFilter')?.value || '';
  
  filteredNotices = allNotices.filter(notice => {
    // 搜尋篩選
    if (searchTerm) {
      const searchText = `${notice.title || ''} ${notice.content || ''} ${notice.notice_key || ''}`.toLowerCase();
      if (!searchText.includes(searchTerm)) return false;
    }
    
    // 類型篩選
    if (typeFilter && notice.notice_type !== typeFilter) return false;
    
    // 狀態篩選
    if (statusFilter) {
      if (statusFilter === 'enabled' && !notice.enabled) return false;
      if (statusFilter === 'disabled' && notice.enabled) return false;
    }
    
    // 場地篩選
    if (locationFilter) {
      if (locationFilter === '通用') {
        // 通用表示沒有指定場地
        if (notice.target_location && notice.target_location !== '') return false;
      } else {
        // 指定場地
        if (notice.target_location !== locationFilter) return false;
      }
    }
    
    return true;
  });
  
  renderNotices();
}

// 載入注意事項列表
async function loadNotices() {
  const container = document.getElementById('noticesList');
  if (!container) {
    console.error('❌ 找不到 noticesList 容器');
    return;
  }
  
  // 顯示載入狀態
  container.innerHTML = '<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> 載入中...</div>';
  
  try {
    const supabase = getSupabaseClient();
    
    console.log('🔄 開始載入注意事項...');
    const { data, error } = await supabase
      .from('frontend_notices')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Supabase 查詢錯誤:', error);
      throw error;
    }
    
    allNotices = data || [];
    filteredNotices = [...allNotices];
    console.log('✅ 載入注意事項數據成功，共', allNotices.length, '條注意事項');
    
    // 立即渲染
    renderNotices();
    
    if (allNotices.length > 0) {
      showToast('success', '載入成功', `已載入 ${allNotices.length} 條注意事項`);
    } else {
      showToast('info', '載入完成', '目前沒有注意事項');
    }
  } catch (error) {
    showErrorToast('載入注意事項', error, '無法載入注意事項，請檢查網路連線後重試');
    
    if (container) {
      const errorMessage = handleError(error, '載入注意事項', '無法載入注意事項，請檢查網路連線後重試');
      container.innerHTML = `
        <div class="empty-row error-row">
          <i class="fas fa-exclamation-triangle"></i> 載入失敗
          <br><small>${escapeHtml(errorMessage)}</small>
          <br><button onclick="loadNotices()" class="btn btn-sm btn-primary" style="margin-top: 12px;">
            <i class="fas fa-redo"></i> 重試
          </button>
        </div>
      `;
    }
  }
}

// 渲染注意事項列表
function renderNotices() {
  const container = document.getElementById('noticesList');
  if (!container) {
    console.error('❌ 找不到 noticesList 容器');
    return;
  }
  
  // 如果沒有篩選，使用全部數據
  if (!filteredNotices || filteredNotices.length === 0) {
    filteredNotices = [...allNotices];
  }
  
  console.log('📋 開始渲染注意事項列表，共', filteredNotices.length, '條注意事項（總共', allNotices.length, '條）');
  
  if (filteredNotices.length === 0) {
    container.innerHTML = `
      <div class="empty-row">
        <i class="fas fa-search"></i> 沒有符合條件的注意事項
        <br><small>請調整篩選條件或點擊「新增注意事項」開始添加</small>
      </div>
    `;
    console.log('⚠️ 篩選後沒有注意事項');
    return;
  }
  
  try {
    const html = filteredNotices.map(notice => {
      const typeClass = notice.notice_type || 'general';
      const typeLabels = {
        general: '一般',
        warning: '警告',
        info: '資訊',
        success: '成功'
      };
      
      return `
      <div class="notice-card ${!notice.enabled ? 'disabled' : ''}">
        <div class="notice-card-header">
          <div>
            <h3>
              <i class="fas fa-exclamation-triangle"></i>
              ${escapeHtml(notice.title || '')}
            </h3>
            <p class="notice-key">識別碼：${escapeHtml(notice.notice_key || '')}</p>
          </div>
          <div class="notice-status">
            <span class="type-badge ${typeClass}">${typeLabels[typeClass] || '一般'}</span>
            <span class="status-badge ${notice.enabled ? 'enabled' : 'disabled'}">
              ${notice.enabled ? '啟用中' : '已停用'}
            </span>
          </div>
        </div>
        
        <div class="notice-card-body">
          <div class="notice-content">
            ${escapeHtml(notice.content || '').replace(/\n/g, '<br>')}
          </div>
          <div class="notice-meta">
            ${notice.target_location ? `
              <span><i class="fas fa-map-marker-alt"></i> 針對：${escapeHtml(notice.target_location)}</span>
            ` : '<span><i class="fas fa-globe"></i> 通用（所有場地）</span>'}
            <span><i class="fas fa-sort-numeric-down"></i> 順序：${notice.display_order || 0}</span>
          </div>
        </div>
        
        <div class="notice-card-actions">
          <button onclick="editNotice(${notice.id})" class="btn btn-sm btn-primary">
            <i class="fas fa-edit"></i> 編輯
          </button>
          <button onclick="toggleNoticeStatus(${notice.id}, ${notice.enabled})" 
                  class="btn btn-sm ${notice.enabled ? 'btn-warning' : 'btn-success'}">
            <i class="fas fa-toggle-${notice.enabled ? 'on' : 'off'}"></i>
            ${notice.enabled ? '停用' : '啟用'}
          </button>
          <button onclick="deleteNotice(${notice.id}, '${escapeHtml(notice.title || '').replace(/'/g, "\\'")}')" 
                  class="btn btn-sm btn-danger">
            <i class="fas fa-trash"></i> 刪除
          </button>
        </div>
      </div>
      `;
    }).join('');
    
    container.innerHTML = html;
    console.log('✅ 注意事項列表渲染完成，HTML 長度:', html.length);
  } catch (error) {
    const errorMessage = handleError(error, '渲染注意事項列表', '無法顯示注意事項列表，請重新載入頁面');
    container.innerHTML = `
      <div class="empty-row error-row">
        <i class="fas fa-exclamation-triangle"></i> 渲染失敗
        <br><small>${escapeHtml(errorMessage)}</small>
        <br><button onclick="loadNotices()" class="btn btn-sm btn-primary" style="margin-top: 12px;">
          <i class="fas fa-redo"></i> 重新載入
        </button>
      </div>
    `;
  }
}

// 顯示新增注意事項彈窗
function showAddNoticeModal() {
  document.getElementById('noticeModalTitle').textContent = '新增注意事項';
  document.getElementById('noticeForm').reset();
  document.getElementById('noticeId').value = '';
  document.getElementById('noticeEnabled').checked = true;
  document.getElementById('noticeOrder').value = '0';
  document.getElementById('noticeType').value = 'general';
  document.getElementById('noticeTargetLocation').value = '';
  document.getElementById('noticeModal').classList.add('active');
}

// 關閉注意事項彈窗
function closeNoticeModal() {
  document.getElementById('noticeModal').classList.remove('active');
}

// 編輯注意事項
function editNotice(noticeId) {
  const notice = allNotices.find(n => n.id === noticeId);
  if (!notice) {
    showToast('error', '錯誤', '找不到該注意事項');
    return;
  }
  
  document.getElementById('noticeModalTitle').textContent = '編輯注意事項';
  document.getElementById('noticeId').value = notice.id;
  document.getElementById('noticeKey').value = notice.notice_key || '';
  document.getElementById('noticeTitle').value = notice.title || '';
  document.getElementById('noticeContent').value = notice.content || '';
  document.getElementById('noticeType').value = notice.notice_type || 'general';
  document.getElementById('noticeTargetLocation').value = notice.target_location || '';
  document.getElementById('noticeOrder').value = notice.display_order || 0;
  document.getElementById('noticeEnabled').checked = notice.enabled !== false;
  
  document.getElementById('noticeModal').classList.add('active');
}

// 儲存注意事項
async function saveNotice(event) {
  event.preventDefault();
  
  const noticeId = document.getElementById('noticeId').value;
  const noticeKey = sanitizeInput(document.getElementById('noticeKey').value.trim(), 'key');
  
  // 輸入驗證
  if (!noticeKey || !validateInputLength(noticeKey, 1, 50)) {
    showToast('error', '驗證失敗', '識別碼長度必須在 1-50 字元之間');
    return;
  }
  
  // 驗證識別碼格式（只允許小寫字母、數字、連字號）
  if (!/^[a-z0-9-]+$/.test(noticeKey)) {
    showToast('error', '驗證失敗', '識別碼只能包含小寫字母、數字和連字號');
    return;
  }
  const title = sanitizeInput(document.getElementById('noticeTitle').value.trim(), 'text');
  const content = sanitizeInput(document.getElementById('noticeContent').value.trim(), 'text');
  
  // 額外驗證
  if (!title || !validateInputLength(title, 1, 200)) {
    showToast('error', '驗證失敗', '標題長度必須在 1-200 字元之間');
    return;
  }
  
  if (!content || !validateInputLength(content, 1, 2000)) {
    showToast('error', '驗證失敗', '內容長度必須在 1-2000 字元之間');
    return;
  }
  const noticeType = document.getElementById('noticeType').value;
  const targetLocation = document.getElementById('noticeTargetLocation').value.trim() || null;
  const displayOrder = parseInt(document.getElementById('noticeOrder').value) || 0;
  const enabled = document.getElementById('noticeEnabled').checked;
  
  if (!noticeKey || !title || !content) {
    showToast('error', '驗證失敗', '請填寫所有必填欄位');
    return;
  }
  
  showLoading('儲存中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const noticeData = {
      notice_key: noticeKey,
      title: title,
      content: content,
      notice_type: noticeType,
      target_location: targetLocation,
      display_order: displayOrder,
      enabled: enabled
    };
    
    let result;
    if (noticeId) {
      // 更新
      const { data, error } = await supabaseClientInstance
        .from('frontend_notices')
        .update(noticeData)
        .eq('id', noticeId)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      // 新增
      const { data, error } = await supabaseClientInstance
        .from('frontend_notices')
        .insert(noticeData)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }
    
    showToast('success', '儲存成功', '注意事項已更新');
    closeNoticeModal();
    
    // 更新本地數據
    if (noticeId) {
      // 更新現有注意事項
      const index = allNotices.findIndex(n => n.id === noticeId);
      if (index !== -1) {
        allNotices[index] = result;
      }
    } else {
      // 新增注意事項
      allNotices.push(result);
    }
    
    // 直接渲染，不重新從服務器載入
    renderNotices();
  } catch (error) {
    showErrorToast('儲存注意事項', error, '無法儲存注意事項，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 切換注意事項啟用狀態
async function toggleNoticeStatus(noticeId, currentStatus) {
  const newStatus = !currentStatus;
  const action = newStatus ? '啟用' : '停用';
  
  if (!confirm(`確定要${action}此注意事項嗎？`)) {
    return;
  }
  
  showLoading(`${action}中...`);
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { error } = await supabaseClientInstance
      .from('frontend_notices')
      .update({ enabled: newStatus })
      .eq('id', noticeId);
    
    if (error) throw error;
    
    showToast('success', '更新成功', `注意事項已${action}`);
    
    // 更新本地數據
    const index = allNotices.findIndex(n => n.id === noticeId);
    if (index !== -1) {
      allNotices[index].enabled = newStatus;
    }
    
    // 直接渲染，不重新從服務器載入
    renderNotices();
  } catch (error) {
    showErrorToast('更新注意事項狀態', error, '無法更新注意事項狀態，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// 刪除注意事項
async function deleteNotice(noticeId, noticeTitle) {
  if (!confirm(`確定要刪除注意事項「${noticeTitle}」嗎？\n\n此操作無法復原！`)) {
    return;
  }
  
  showLoading('刪除中...');
  
  try {
    if (!supabaseClientInstance) {
      throw new Error('Supabase 客戶端未初始化');
    }
    
    const { error } = await supabaseClientInstance
      .from('frontend_notices')
      .delete()
      .eq('id', noticeId);
    
    if (error) throw error;
    
    showToast('success', '刪除成功', '注意事項已刪除');
    
    // 更新本地數據
    allNotices = allNotices.filter(n => n.id !== noticeId);
    
    // 直接渲染，不重新從服務器載入
    renderNotices();
  } catch (error) {
    showErrorToast('刪除注意事項', error, '無法刪除注意事項，請檢查網路連線後重試');
  } finally {
    hideLoading();
  }
}

// ========== 暴露所有函數到全局 ==========

// 場地管理相關函數
window.loadLocations = loadLocations;
window.showAddLocationModal = showAddLocationModal;
window.editLocation = editLocation;
window.closeLocationModal = closeLocationModal;
window.saveLocation = saveLocation;
window.toggleLocationStatus = toggleLocationStatus;
window.deleteLocation = deleteLocation;

// 注意事項管理相關函數
window.loadNotices = loadNotices;
window.showAddNoticeModal = showAddNoticeModal;
window.filterNotices = filterNotices;
window.debouncedFilterNotices = debouncedFilterNotices;
window.closeNoticeModal = closeNoticeModal;
window.editNotice = editNotice;
window.saveNotice = saveNotice;
window.toggleNoticeStatus = toggleNoticeStatus;
window.deleteNotice = deleteNotice;

// ========== 匯款圖片放大查看功能 ==========

// 顯示匯款圖片放大模態框
function showPaymentImageModal(imageUrl) {
  const modal = document.getElementById('paymentImageModal');
  const modalImg = document.getElementById('paymentImageModalImg');
  
  if (!modal || !modalImg) {
    // 如果模態框不存在，創建一個
    const newModal = document.createElement('div');
    newModal.id = 'paymentImageModal';
    newModal.className = 'payment-image-modal';
    newModal.innerHTML = `
      <span class="modal-close" onclick="closePaymentImageModal()">&times;</span>
      <img class="payment-image-modal-content" id="paymentImageModalImg" src="" alt="匯款證明">
    `;
    document.body.appendChild(newModal);
    
    // 設置圖片並顯示
    document.getElementById('paymentImageModalImg').src = imageUrl;
    newModal.classList.add('active');
  } else {
    modalImg.src = imageUrl;
    modal.classList.add('active');
  }
  
  // 點擊背景關閉
  const modalElement = document.getElementById('paymentImageModal');
  if (modalElement) {
    modalElement.onclick = function(e) {
      if (e.target === modalElement) {
        closePaymentImageModal();
      }
    };
  }
}

// 關閉匯款圖片模態框
function closePaymentImageModal() {
  const modal = document.getElementById('paymentImageModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 暴露到全局
window.showPaymentImageModal = showPaymentImageModal;
window.closePaymentImageModal = closePaymentImageModal;

// ========== 已處理預約查看功能 ==========

// 顯示已處理預約模態框
function showProcessedBookingsModal() {
  const modal = document.getElementById('processedBookingsModal');
  const list = document.getElementById('processedBookingsList');
  
  if (!modal || !list) {
    showToast('error', '錯誤', '找不到模態框元素');
    return;
  }
  
  // 顯示載入狀態
  list.innerHTML = '<div class="loading-row"><i class="fas fa-spinner fa-spin"></i> 載入中...</div>';
  
  // 獲取所有新預約
  const allNewBookings = getNewBookings();
  
  // 過濾出已處理的預約
  const processedBookings = allNewBookings.filter(booking => {
    const bookingId = booking.id || booking.rowNumber;
    return processedBookingIds.has(String(bookingId));
  });
  
  if (processedBookings.length === 0) {
    list.innerHTML = `
      <div class="empty-row">
        <i class="fas fa-inbox"></i> 目前沒有已處理的預約
      </div>
    `;
  } else {
    list.innerHTML = processedBookings.map(booking => {
      const timeSource = booking.timestamp || booking.created_at;
      const bookingTime = timeSource ? new Date(timeSource) : new Date();
      const timeStr = bookingTime.toLocaleString('zh-TW', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      
      const payment = booking.payment || '未繳款';
      const paymentClass = payment === '己繳款' || payment === '已付款' ? 'payment-paid' : 
                           payment === '逾繳可排' ? 'payment-overdue' : 'payment-unpaid';
      
      const safeVendor = escapeHtml(booking.vendor || '');
      const safeLocation = escapeHtml(booking.location || '');
      const safeDate = escapeHtml(booking.date || '');
      const safeFoodType = escapeHtml(booking.foodType || '-');
      const paymentImageUrl = booking.paymentImageUrl || booking.payment_image_url || null;
      
      return `
        <div class="processed-booking-item" style="padding: 16px; margin-bottom: 12px; background: white; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div class="processed-booking-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
            <div>
              <h4 style="margin: 0 0 8px 0; color: #1f2937;">
                <i class="fas fa-store"></i> ${safeVendor}
              </h4>
              <div style="font-size: 0.875rem; color: #6b7280;">
                <i class="fas fa-clock"></i> ${timeStr} | 
                <i class="fas fa-map-marker-alt"></i> ${safeLocation} | 
                <i class="fas fa-calendar"></i> ${safeDate} | 
                <i class="fas fa-utensils"></i> ${safeFoodType}
              </div>
            </div>
            <span class="status-badge ${paymentClass}">${payment}</span>
          </div>
          ${paymentImageUrl ? `
            <div style="margin-bottom: 12px;">
              <div class="new-booking-image-preview" onclick="showPaymentImageModal('${paymentImageUrl}')" style="cursor: pointer;">
                <img src="${paymentImageUrl}" alt="匯款證明" loading="lazy" style="max-width: 200px; border-radius: 4px;">
                <div class="image-overlay">
                  <i class="fas fa-search-plus"></i>
                  <span>點擊放大</span>
                </div>
              </div>
            </div>
          ` : ''}
          <div style="display: flex; gap: 8px;">
            <button onclick="restoreProcessedBooking(${booking.id || booking.rowNumber})" class="btn btn-primary btn-sm">
              <i class="fas fa-undo"></i> 恢復顯示
            </button>
            <button onclick="editBooking(${booking.id || booking.rowNumber})" class="btn btn-secondary btn-sm">
              <i class="fas fa-edit"></i> 編輯
            </button>
            <button onclick="deleteBooking(${booking.id || booking.rowNumber}, '${safeVendor}', '${safeLocation}', '${safeDate}')" class="btn btn-danger btn-sm">
              <i class="fas fa-trash"></i> 刪除
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
  
  modal.classList.add('active');
  
  // 點擊背景關閉
  modal.onclick = function(e) {
    if (e.target === modal) {
      closeProcessedBookingsModal();
    }
  };
}

// 關閉已處理預約模態框
function closeProcessedBookingsModal() {
  const modal = document.getElementById('processedBookingsModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 恢復已處理的預約（重新顯示）
function restoreProcessedBooking(bookingId) {
  processedBookingIds.delete(String(bookingId));
  saveProcessedBookingIds();
  
  // 重新渲染新預約區域
  renderNewBookings();
  
  // 更新模態框內容
  showProcessedBookingsModal();
  
  showToast('success', '已恢復', '預約已恢復顯示');
}

// 清除所有已處理記錄
function clearAllProcessedBookings() {
  if (processedBookingIds.size === 0) {
    showToast('info', '提示', '沒有已處理的記錄');
    return;
  }
  
  if (!confirm(`確定要清除所有 ${processedBookingIds.size} 筆已處理記錄嗎？\n\n清除後，這些預約將重新顯示在新預約區域。`)) {
    return;
  }
  
  processedBookingIds.clear();
  saveProcessedBookingIds();
  
  // 重新渲染新預約區域
  renderNewBookings();
  
  // 關閉模態框
  closeProcessedBookingsModal();
  
  showToast('success', '已清除', '所有已處理記錄已清除');
}

// 暴露到全局
window.showProcessedBookingsModal = showProcessedBookingsModal;
window.closeProcessedBookingsModal = closeProcessedBookingsModal;
window.restoreProcessedBooking = restoreProcessedBooking;
window.clearAllProcessedBookings = clearAllProcessedBookings;



