// 時間戳記格式化函數（只到秒數，不含毫秒）
function formatTimestamp(date = new Date()) {
  return date.toISOString().split('.')[0] + 'Z'; // 移除毫秒，保留Z
}

// 多場地規則配置
const locationConfigs = {
  "四維路59號": {
    name: "楊梅區四維路59號",
    address: "楊梅區四維路59號",
    type: "戶外場地",
    days: [1, 2, 3, 4, 5, 6, 0], // 整個月都可以排
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車，餐車高度限制",
      ban: "油炸落地攤、煙霧太大、飲料車",
      special: "整月都可排班"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "禁止油炸落地攤，其他可以不限，禁煙霧太大",
      "禁止飲料及飲料車",
      "餐車高度限制，請特別注意",
      "房東很注重地板要記得鋪地墊",
      "桶仔雞煙霧太大不行",
      "發電機老式太吵不行"
    ]
  },
  "四維路60號": {
    name: "楊梅區四維路60號",
    address: "楊梅區四維路60號",
    type: "戶外場地",
    days: [1, 2, 3], // 週一~週三可以營業
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車",
      ban: "油炸落地攤、煙霧太大",
      special: "該場地週一~週三營業，國定假日休息"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "要靠左邊直停為主",
      "使用面積較小的餐車可以橫放",
      "落地攤也可以橫放",
      "禁止油炸落地攤、煙霧太大"
    ]
  },
  "漢堡大亨": {
    name: "漢堡大亨",
    address: "楊梅區四維路70號",
    type: "合作店面",
    days: [1, 2, 3, 4, 5, 6], // 只有週日休，其它日都可以排
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車、不要把車開上磁磚",
      ban: "油煙霧太大、飲料車",
      special: "該場地週日休息"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "僅限1車，請勿把車開上磁磚",
      "禁止油煙霧太大的餐車",
      "禁止飲料車",
      "需配合店面營業時間"
    ]
  },
  "自由風": {
    name: "自由風",
    address: "楊梅區四維路190號",
    type: "合作店面",
    days: [0, 1, 2, 3, 4, 5], // 週六不排，其它都可排（日、一、二、三、四、五）
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車，需配合店面營業",
      ban: "煙霧太大、飲料車",
      special: "週六不開放排班"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "僅限1車，需配合店面營業",
      "禁止煙霧太大的餐車",
      "禁止飲料車",
      "週六不開放排班"
    ]
  },
  "蔬蒔": {
    name: "蔬蒔",
    address: "楊梅區四維路216號",
    type: "健康蔬食",
    days: [3, 6], // 只有週三、週六可排
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車，不要跟店面強碰商品",
      ban: "飲料車、素食",
      special: "只有週三、週六可排班"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "僅限1車，請勿與店面商品強碰",
      "只有週三、週六可排班",
      "禁止飲料車、素食",
      "建議健康蔬食類型餐車"
    ]
  },
  "金正好吃": {
    name: "金正好吃",
    address: "楊梅區四維路218號",
    type: "美食廣場",
    days: [2], // 只有週二可以排班
    slots: ["14:00-20:00"],
    price: {
      "14:00-20:00": "600元"
    },
    info: {
      hours: "14:00-20:00",
      fee: "600元/天",
      limit: "僅限1車",
      ban: "煙霧太大、噪音過大",
      special: "該場地僅限週二營業"
    },
    notices: [
      "不供水、不供電，需自行清潔環境及垃圾處理",
      "僅限1車",
      "禁止煙霧太大的餐車",
      "禁止噪音過大的設備",
      "僅限週二營業"
    ]
  }
};

// 已預約的日期和時段 - 根據Google Sheets 10月份實際排班資料
// 已預約時段 - 現在完全從 Google Sheets 動態載入
const bookedSlots = {
  "四維路59號": {},
  "四維路60號": {},
  "漢堡大亨": {},
  "自由風": {},
  "蔬蒔": {},
  "金正好吃": {}
};

// 當前選中的場地
let currentLocation = "四維路59號";

// 場地分頁切換
document.querySelectorAll('.location-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    // 移除所有active類
    document.querySelectorAll('.location-tab').forEach(t => t.classList.remove('active'));
    // 添加active類到當前選中
    tab.classList.add('active');
    
    // 更新當前場地
    currentLocation = tab.dataset.location;
    
    // 更新表單中的場地選擇
    document.getElementById('location').value = currentLocation;
    
    // 觸發報名表場地選擇的change事件
    document.getElementById('location').dispatchEvent(new Event('change'));
    
    // 更新場地資訊顯示
    updateLocationInfo(currentLocation);
    
    // 更新行事曆篩選
    currentFilter = currentLocation;
    // 更新行事曆篩選按鈕的active狀態
    document.querySelectorAll('.location-filter .filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.location === currentLocation) {
        btn.classList.add('active');
      }
    });
    // 重新渲染行事曆
    renderCalendar();
  });
});

// 更新場地資訊顯示
function updateLocationInfo(location) {
  const config = locationConfigs[location];
  if (!config) return;
  
  // 顯示完整地址作為標題
  let displayTitle = config.address; // 使用地址而非名稱
  
  // 如果是店面場地，可以在地址後加上店名說明
  if (config.type !== '戶外場地') {
    displayTitle = `${config.address} (${location})`;
  }
  
  let specialNotice = '';
  if (config.info.special) {
    specialNotice = `
      <div class="special-notice">
        <i class="fas fa-exclamation-triangle"></i>
        <span>${config.info.special}</span>
      </div>
    `;
  }
  
  const locationInfo = document.getElementById('locationInfo');
  locationInfo.innerHTML = `
    <h3><i class="fas fa-map-marker-alt"></i> ${displayTitle}</h3>
    ${specialNotice}
    <div class="info-grid">
      <div class="info-item">
        <i class="fas fa-clock"></i>
        <span><strong>營業時間：</strong>${config.info.hours}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-dollar-sign"></i>
        <span><strong>費用：</strong>${config.info.fee}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-truck"></i>
        <span><strong>限制：</strong>${config.info.limit}</span>
      </div>
      <div class="info-item">
        <i class="fas fa-ban"></i>
        <span><strong>禁止：</strong>${config.info.ban}</span>
      </div>
    </div>
  `;
  
  // 更新注意事項
  const noticeBox = document.getElementById('noticeBox');
  if (noticeBox && config.notices) {
    const noticesList = config.notices.map(notice => `<li>${notice}</li>`).join('');
    noticeBox.innerHTML = `
      <h4><i class="fas fa-exclamation-triangle"></i> 重要注意事項</h4>
      <ul>
        ${noticesList}
      </ul>
    `;
  }
}

// 2025年主要國定假日列表
const nationalHolidays2025 = [
  '2025-01-01', // 元旦
  '2025-01-28', '2025-01-29', '2025-01-30', '2025-01-31', '2025-02-01', '2025-02-02', '2025-02-03', // 春節連假
  '2025-04-04', '2025-04-05', '2025-04-06', '2025-04-07', // 清明節連假
  '2025-05-01', // 勞動節
  '2025-05-31', // 端午節
  '2025-10-06', '2025-10-07', '2025-10-08', // 中秋節連假
  '2025-10-10', '2025-10-11', '2025-10-12', '2025-10-13', // 國慶日連假
  '2025-12-25'  // 聖誕節
];

// 生成可用日期選項 - 完全分離條件版本
function generateAvailableDates(location) {
  const locationConfig = locationConfigs[location];
  if (!locationConfig) {
    console.log('找不到場地配置:', location);
    return [];
  }
  
  const availableDates = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // 條件1：生成可預約的 4 個月（當前月份～當前+3個月）
  const currentMonth = today.getMonth() + 1; // 1-12
  const currentYear = today.getFullYear();
  
  // 生成當前月份和未來 3 個月的所有日期（共 4 個月，四月應可預約）
  for (let i = 0; i < 4; i++) {
    const targetMonth = currentMonth + i;
    const targetYear = currentYear;
    
    let year, month;
    if (targetMonth > 12) {
      year = targetYear + Math.floor((targetMonth - 1) / 12);
      month = ((targetMonth - 1) % 12) + 1;
    } else {
      year = targetYear;
      month = targetMonth;
    }
    
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // 條件2：只處理未來日期（報名用）
      if (date < today) continue;
      
      // 條件3：檢查是否為該場地的營業日
      if (!locationConfig.days.includes(dayOfWeek)) continue;
      
      // 條件4：特別處理四維路60號的國定假日（直接跳過，不可選擇）
      if (location === '四維路60號' && nationalHolidays2025.includes(dateStr)) {
        console.log(`四維路60號國定假日不可預約: ${dateStr} (${getHolidayName(dateStr)})`);
        continue; // 國定假日直接跳過，不添加到可選日期
      }
      
      // 條件5：檢查日曆上是否已有餐車預約（包含本地和Google Sheets）
      const hasEvent = allEvents.some(event => {
        let eventDate;
        if (event.start instanceof Date) {
          eventDate = event.start.toISOString().split('T')[0];
        } else {
          eventDate = event.start.split('T')[0];
        }
        return eventDate === dateStr && event.location === location;
      });
      
      // 條件5.5：檢查Google Sheets中是否已有預約
      const hasSheetBooking = sheetsBookedDates[location] && 
        sheetsBookedDates[location].some(booking => booking.standardDate === dateStr);
      
      // 條件6：時間控制檢查 - 開放當前～當前+3個月
      const currentDay = today.getDate();
      const isTimeControlled = checkTimeControl(year, month, currentYear, currentMonth, currentDay);
      
      // 只有通過所有條件的日期才加入選項（排除本地預約和Sheets預約）
      if (!hasEvent && !hasSheetBooking && isTimeControlled) {
        const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
        const displayDate = `${month}月${day}日(${dayNames[dayOfWeek]})`;
        availableDates.push({
          value: dateStr,
          text: displayDate,
          dayOfWeek: dayOfWeek
        });
      }
    }
  }
  
  // 按日期排序
  availableDates.sort((a, b) => a.value.localeCompare(b.value));
  
  console.log(`場地: ${location}, 最終可用日期數量: ${availableDates.length}`);
  return availableDates;
}

// 取消預約功能
function cancelBooking(event, dateStr) {
  // 顯示取消預約彈窗
  showCancelModal(event, dateStr);
}

// 顯示取消預約彈窗
function showCancelModal(event, dateStr) {
  // 填充預約詳情
  document.getElementById('cancelVendorName').textContent = event.title;
  document.getElementById('cancelLocation').textContent = event.location;
  document.getElementById('cancelDate').textContent = dateStr;
  
  // 儲存當前事件和日期供後續使用
  window.currentCancelEvent = event;
  window.currentCancelDate = dateStr;
  
  // 顯示彈窗
  const modal = document.getElementById('cancelModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉取消預約彈窗
function closeCancelModal() {
  const modal = document.getElementById('cancelModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示密碼輸入彈窗
function showPasswordInput() {
  closeCancelModal();
  const modal = document.getElementById('passwordModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // 聚焦到密碼輸入框
  setTimeout(() => {
    document.getElementById('passwordInput').focus();
  }, 100);
}

// 關閉密碼輸入彈窗
function closePasswordModal() {
  const modal = document.getElementById('passwordModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // 清空密碼輸入框
  document.getElementById('passwordInput').value = '';
}

// ========== 管理選項功能（審計/取消二選一）==========

// 顯示管理選項彈窗
function showAdminOptionsModal(event, dateStr) {
  // 填充預約資訊
  document.getElementById('adminVendorName').textContent = event.title;
  document.getElementById('adminLocation').textContent = event.location;
  document.getElementById('adminDate').textContent = dateStr;
  
  // 顯示付款狀態
  const paymentStatusSpan = document.getElementById('adminPaymentStatus');
  if (event.payment === '已付款' || event.payment === '己繳款') {
    paymentStatusSpan.textContent = '✓ 已付款';
    paymentStatusSpan.style.color = '#28a745';
  } else if (event.payment === '尚未付款') {
    paymentStatusSpan.textContent = '尚未付款';
    paymentStatusSpan.style.color = '#ffc107';
  } else {
    paymentStatusSpan.textContent = event.payment || '未知';
    paymentStatusSpan.style.color = '#666';
  }
  
  // 儲存當前事件和日期供後續使用
  window.currentAdminEvent = event;
  window.currentAdminDate = dateStr;
  
  // 顯示彈窗
  const modal = document.getElementById('adminOptionsModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉管理選項彈窗
function closeAdminOptionsModal() {
  const modal = document.getElementById('adminOptionsModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 選擇審計選項
function selectAuditOption() {
  closeAdminOptionsModal();
  const event = window.currentAdminEvent;
  const dateStr = window.currentAdminDate;
  showAuditModal(event, dateStr);
}

// 選擇取消選項
function selectCancelOption() {
  closeAdminOptionsModal();
  const event = window.currentAdminEvent;
  const dateStr = window.currentAdminDate;
  showCancelModal(event, dateStr);
}

// ========== 審計功能 ==========

// 顯示審計彈窗
function showAuditModal(event, dateStr) {
  // 填充審計詳情
  document.getElementById('auditVendorName').textContent = event.title;
  document.getElementById('auditLocation').textContent = event.location;
  document.getElementById('auditDate').textContent = dateStr;
  
  // 儲存當前事件和日期供後續使用
  window.currentAuditEvent = event;
  window.currentAuditDate = dateStr;
  
  // 顯示彈窗
  const modal = document.getElementById('auditModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉審計彈窗
function closeAuditModal() {
  const modal = document.getElementById('auditModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示審計密碼輸入彈窗
function showAuditPasswordInput() {
  closeAuditModal();
  const modal = document.getElementById('auditPasswordModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  
  // 聚焦到密碼輸入框
  setTimeout(() => {
    document.getElementById('auditPasswordInput').focus();
  }, 100);
}

// 關閉審計密碼輸入彈窗
function closeAuditPasswordModal() {
  const modal = document.getElementById('auditPasswordModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // 清空密碼輸入框
  document.getElementById('auditPasswordInput').value = '';
}

// 驗證審計密碼
async function verifyAuditPassword() {
  const password = document.getElementById('auditPasswordInput').value;
  const event = window.currentAuditEvent;
  const dateStr = window.currentAuditDate;
  
  if (!password) {
    showToast('error', '密碼錯誤', '請輸入密碼');
    return;
  }
  
  if (password !== 'sky36990') {
    showToast('error', '密碼錯誤', '審計密碼不正確，無法更新付款狀態');
    document.getElementById('auditPasswordInput').value = '';
    return;
  }

  // 密碼正確，關閉密碼彈窗並顯示載入狀態
  closeAuditPasswordModal();
  showLoading('正在更新付款狀態...', '請稍候，系統正在處理中');
  
  try {
    // 發送請求更新付款狀態為「己繳款」
    const updateData = {
      action: 'updatePayment',
      vendor: event.title,
      location: event.location,
      date: dateStr,
      rowNumber: event.rowNumber,
      payment: '己繳款'
    };
    
    console.log('發送審計更新請求:', updateData);
    
    // 使用 Google Sheets submitToGoogleSheets 函數
    const result = await submitToGoogleSheets(updateData);
    
    console.log('審計更新回應:', result);
    
    hideLoading();
    
    if (result.success) {
      showToast('success', '更新成功', `已將 ${event.title} 的付款狀態更新為「己繳款」`);
      
      // 多次同步確保更新
      setTimeout(async () => {
        try {
          console.log('審計後第1次同步（2秒後）...');
          await fetchBookingsFromGoogleSheets();
          await fetchBookedDatesFromSheets();
          mergeSheetsDataToCalendar();
          saveToLocalStorage();
          console.log('審計後第1次同步完成');
        } catch (error) {
          console.error('審計後同步失敗:', error);
        }
      }, 2000);
      
      setTimeout(async () => {
        try {
          console.log('審計後第2次同步（4秒後）...');
          await fetchBookingsFromGoogleSheets();
          mergeSheetsDataToCalendar();
          saveToLocalStorage();
          console.log('審計後第2次同步完成');
        } catch (error) {
          console.error('審計後同步失敗:', error);
        }
      }, 4000);
    } else {
      showToast('error', '更新失敗', result.message || '無法更新付款狀態，請稍後再試');
    }
    
  } catch (error) {
    console.error('更新付款狀態失敗:', error);
    hideLoading();
    showToast('error', '更新失敗', '無法更新付款狀態，請稍後再試');
  }
}

// 顯示使用教學彈窗
function showHelpModal() {
  const modal = document.getElementById('helpModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉使用教學彈窗
function closeHelpModal() {
  const modal = document.getElementById('helpModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示群組版規彈窗
function showRulesModal() {
  const modal = document.getElementById('rulesModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉群組版規彈窗
function closeRulesModal() {
  const modal = document.getElementById('rulesModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示下載素材彈窗
function showDownloadModal() {
  const modal = document.getElementById('downloadModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉下載素材彈窗
function closeDownloadModal() {
  const modal = document.getElementById('downloadModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示活動詳細必看彈窗
function showActivityModal() {
  const modal = document.getElementById('activityModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉活動詳細必看彈窗
function closeActivityModal() {
  const modal = document.getElementById('activityModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 顯示排班釋出彈窗
function showTransferModal(event, dateStr) {
  console.log('========== 開啟排班釋出彈窗 ==========');
  console.log('事件資訊:', event);
  
  // 填充原預約資訊
  document.getElementById('transferOriginalVendor').textContent = event.title;
  document.getElementById('transferLocation').textContent = event.location;
  
  // 格式化日期顯示
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dayName = dayNames[date.getDay()];
  const formattedDate = `${month}月${day}日(${dayName})`;
  
  document.getElementById('transferDate').textContent = formattedDate;
  
  // 儲存釋出資訊供後續使用（rowNumber 與 id 皆為 Supabase 主鍵，用於 .eq('id', ...)）
  window.currentTransferEvent = {
    originalEvent: event,
    dateStr: dateStr,
    formattedDate: formattedDate,
    location: event.location,
    rowNumber: event.rowNumber ?? event.id,
    id: event.id ?? event.rowNumber
  };
  
  console.log('保存的釋出資訊:', window.currentTransferEvent);
  
  // 清空表單
  document.getElementById('transferVendorName').value = '';
  document.getElementById('transferFoodType').value = '';
  document.getElementById('transferPassword').value = '';
  
  // 顯示彈窗
  const modal = document.getElementById('transferModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉排班釋出彈窗
function closeTransferModal() {
  const modal = document.getElementById('transferModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // 清空表單
  document.getElementById('transferVendorName').value = '';
  document.getElementById('transferFoodType').value = '';
  document.getElementById('transferPassword').value = '';
}

// 提交排班釋出
async function submitTransfer() {
  const newVendor = document.getElementById('transferVendorName').value.trim();
  const newFoodType = document.getElementById('transferFoodType').value;
  const password = document.getElementById('transferPassword').value;
  
  // 驗證表單
  if (!newVendor || !newFoodType || !password) {
    showToast('error', '表單錯誤', '請完整填寫所有欄位');
    return;
  }
  
  // 驗證密碼
  if (password !== 'sky36990') {
    showToast('error', '密碼錯誤', '換班密碼不正確');
    document.getElementById('transferPassword').value = '';
    return;
  }
  
  if (!window.currentTransferEvent) {
    showToast('error', '錯誤', '無法獲取釋出資訊');
    return;
  }
  
  const transferData = window.currentTransferEvent;
  
  // 確保使用正確的預約 ID（Supabase 主鍵，用於 .eq('id', ...)）
  const targetRowNumber = transferData.originalEvent?.rowNumber ?? transferData.originalEvent?.id ?? transferData.rowNumber ?? transferData.id;
  
  if (targetRowNumber == null || targetRowNumber === '') {
    console.error('❌ 釋出失敗：找不到預約 ID', { transferData, originalEvent: transferData.originalEvent });
    showToast('error', '釋出失敗', '無法取得預約 ID，請重新整理頁面後再試');
    return;
  }
  
  console.log('========== 釋出操作詳細資訊 ==========');
  console.log('原事件資訊:', transferData.originalEvent);
  console.log('targetRowNumber (Supabase id):', targetRowNumber, typeof targetRowNumber);
  console.log('===================================');
  
  // 準備釋出數據
  const formData = {
    vendor: newVendor,
    foodType: newFoodType,
    location: transferData.location,
    date: transferData.dateStr,
    timeSlot: '14:00-20:00',
    fee: '600',
    rowNumber: targetRowNumber, // 使用正確的行號
    action: 'transfer', // 標記為釋出操作
    originalVendor: transferData.originalEvent.title // 記錄原餐車
  };
  
  console.log('========== 準備提交的釋出數據 ==========');
  console.log('完整數據:', formData);
  console.log('行號 rowNumber:', formData.rowNumber);
  console.log('action:', formData.action);
  console.log('===================================');
  
  // 顯示載入提示
  showLoading('🔄 正在處理排班轉讓...');
  
  try {
    // 提交到Google Sheets
    const result = await submitToGoogleSheets(formData);
    
    // 檢查提交結果
    if (result.success) {
      hideLoading();
      showToast('success', '轉讓成功！', `✅ 排班已轉讓\n📤 原：${transferData.originalEvent.title}\n📥 新：${newVendor}`);
      
      // 更新本地事件
      const eventIndex = allEvents.findIndex(e => 
        e === transferData.originalEvent ||
        (e.location === transferData.location && e.start.split('T')[0] === transferData.dateStr)
      );
      
      if (eventIndex >= 0) {
        allEvents[eventIndex] = {
          ...allEvents[eventIndex],
          title: newVendor,
          foodType: newFoodType,
          payment: '已付款', // 保持已付款狀態
          note: `轉出自: ${transferData.originalEvent.title}`
        };
      }
      
      // 重新渲染日曆
      renderCalendar();
      saveToLocalStorage();
      
      // 關閉彈窗
      closeTransferModal();
      
      // 多次同步確認更新
      setTimeout(async () => {
        try {
          console.log('釋出後第1次同步（2秒後）...');
          await fetchBookingsFromGoogleSheets();
          await fetchBookedDatesFromSheets();
          mergeSheetsDataToCalendar();
          renderCalendar();
          console.log('釋出後第1次同步完成');
        } catch (error) {
          console.error('釋出後同步失敗:', error);
        }
      }, 2000);
      
      setTimeout(async () => {
        try {
          console.log('釋出後第2次同步（4秒後）...');
          await fetchBookingsFromGoogleSheets();
          mergeSheetsDataToCalendar();
          renderCalendar();
          console.log('釋出後第2次同步完成');
        } catch (error) {
          console.error('釋出後同步失敗:', error);
        }
      }, 4000);
      
    } else {
      throw new Error(result?.message || '提交失敗');
    }
    
  } catch (error) {
    console.error('釋出失敗:', error);
    hideLoading();
    const errMsg = error?.message || String(error);
    const userMsg = errMsg.includes('Supabase') || errMsg.includes('權限') || errMsg.includes('401') || errMsg.includes('403')
      ? errMsg
      : `無法完成釋出操作：${errMsg}`;
    showToast('error', '釋出失敗', userMsg);
  }
}

// 顯示逾期接手彈窗
function showTakeoverModal(event, dateStr) {
  console.log('========== 開啟接手彈窗 ==========');
  console.log('事件資訊:', event);
  console.log('事件rowNumber:', event.rowNumber);
  console.log('事件source:', event.source);
  
  // 填充原預約資訊
  document.getElementById('originalVendor').textContent = event.title;
  document.getElementById('takeoverLocation').textContent = event.location;
  
  // 格式化日期顯示
  const date = new Date(dateStr);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const dayName = dayNames[date.getDay()];
  const formattedDate = `${month}月${day}日(${dayName})`;
  
  document.getElementById('takeoverDate').textContent = formattedDate;
  
  // 儲存接手資訊供後續使用
  window.currentTakeoverEvent = {
    originalEvent: event,
    dateStr: dateStr,
    formattedDate: formattedDate,
    location: event.location,
    rowNumber: event.rowNumber // 保存行號用於更新
  };
  
  console.log('保存的接手資訊:', window.currentTakeoverEvent);
  console.log('===================================');
  
  // 清空表單
  document.getElementById('takeoverVendorName').value = '';
  document.getElementById('takeoverFoodType').value = '';
  
  // 顯示彈窗
  const modal = document.getElementById('takeoverModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

// 關閉逾期接手彈窗
function closeTakeoverModal() {
  const modal = document.getElementById('takeoverModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
  
  // 清空表單
  document.getElementById('takeoverVendorName').value = '';
  document.getElementById('takeoverFoodType').value = '';
}

// 提交接手預約
async function submitTakeover() {
  const newVendor = document.getElementById('takeoverVendorName').value.trim();
  const newFoodType = document.getElementById('takeoverFoodType').value;
  
  // 驗證表單
  if (!newVendor || !newFoodType) {
    showToast('error', '表單錯誤', '請完整填寫必要欄位');
    return;
  }
  
  if (!window.currentTakeoverEvent) {
    showToast('error', '錯誤', '無法獲取接手資訊');
    return;
  }
  
  const takeoverData = window.currentTakeoverEvent;
  
  console.log('接手操作 - 原事件資訊:', takeoverData.originalEvent);
  console.log('接手操作 - rowNumber:', takeoverData.rowNumber);
  
  // 準備接手數據
  const formData = {
    vendor: newVendor,
    foodType: newFoodType,
    location: takeoverData.location,
    date: takeoverData.dateStr,
    timeSlot: '14:00-20:00',
    fee: '600',
    timestamp: formatTimestamp(),
    rowNumber: takeoverData.rowNumber || takeoverData.originalEvent.rowNumber, // 用於覆蓋更新
    action: 'takeover', // 標記為接手操作
    originalVendor: takeoverData.originalEvent.title // 記錄原餐車
  };
  
  console.log('接手操作 - 提交數據:', formData);
  
  // 顯示載入提示
  showToast('info', '處理中', '🤝 正在為您接手排班...');
  
  // 禁用按鈕
  const submitBtn = document.getElementById('takeoverSubmitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
  submitBtn.disabled = true;
  
  try {
    // 只提交到Google Sheets（GitHub已禁用）
    const result = await submitToGoogleSheets(formData);
    
    // 檢查提交結果
    if (result.success) {
      showToast('success', '接手成功！', `🎉 ${newVendor} 已成功接手\n📍 ${takeoverData.location}\n📅 ${takeoverData.formattedDate}`);
      
      // 更新本地事件
      const eventIndex = allEvents.findIndex(e => 
        e === takeoverData.originalEvent ||
        (e.location === takeoverData.location && e.start.split('T')[0] === takeoverData.dateStr)
      );
      
      if (eventIndex >= 0) {
        // 保持原有的付款狀態（如果原本是已付款，保持已付款）
        const originalPayment = allEvents[eventIndex].payment || '';
        const isPaid = originalPayment === '已付款' || originalPayment === '己繳款';
        const preservedPayment = isPaid ? originalPayment : '尚未付款';
        
        allEvents[eventIndex] = {
          ...allEvents[eventIndex],
          title: newVendor,
          foodType: newFoodType,
          timestamp: formatTimestamp(),
          payment: preservedPayment, // 保持原有付款狀態
          source: 'takeover' // 標記為接手的預約
        };
      }
      
      // 重新渲染日曆
      renderCalendar();
      saveToLocalStorage();
      
      // 關閉彈窗
      closeTakeoverModal();
      
      // 立即重新渲染日曆，顯示本地更新
      renderCalendar();
      
      // 顯示繳費彈窗
      setTimeout(() => {
        showPaymentModal();
      }, 500);
      
      // 多次同步Google Sheets確認更新（確保看到變化）
      // 等待 Google Sheets 更新完成
      setTimeout(async () => {
        try {
          console.log('⏱️ 等待2秒讓 Google Sheets 完成更新...');
        } catch (error) {}
      }, 2000);
      
      setTimeout(async () => {
        try {
          console.log('接手後第1次同步（3秒後）...');
          await fetchBookingsFromGoogleSheets();
          await fetchBookedDatesFromSheets();
          mergeSheetsDataToCalendar();
          renderCalendar();
          console.log('接手後第1次同步完成');
        } catch (error) {
          console.error('接手後第1次同步失敗:', error);
        }
      }, 3000);
      
      setTimeout(async () => {
        try {
          console.log('接手後第2次同步（5秒後）...');
          await fetchBookingsFromGoogleSheets();
          await fetchBookedDatesFromSheets();
          mergeSheetsDataToCalendar();
          renderCalendar();
          console.log('接手後第2次同步完成');
        } catch (error) {
          console.error('接手後第2次同步失敗:', error);
        }
      }, 5000);
      
      setTimeout(async () => {
        try {
          console.log('接手後第3次同步（7秒後）...');
          await fetchBookingsFromGoogleSheets();
          mergeSheetsDataToCalendar();
          renderCalendar();
          console.log('接手後第3次同步完成 - 應該看到新餐車名稱');
        } catch (error) {
          console.error('接手後第3次同步失敗:', error);
        }
      }, 7000);
      
    } else {
      throw new Error('Google Sheets提交失敗');
    }
    
  } catch (error) {
    console.error('接手失敗:', error);
    showToast('error', '接手失敗', '無法完成接手操作，請稍後再試');
    
    // 恢復按鈕狀態
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
  }
}

// 注意：已移除 cancelBookingFromGoogleSheets 函數
// 取消預約現在只處理本地數據和GitHub同步
// Google Sheets的記錄需要手動刪除

// 上傳取消預約到GitHub
async function uploadCancellationToGitHub(event, dateStr) {
  try {
    // 確保cancellations目錄存在
    await createGitHubDirectory('cancellations');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `cancellations/cancellation-${timestamp}.json`;
    
    const cancellationData = {
      action: 'cancellation',
      vendor: event.title,
      location: event.location,
      date: dateStr,
      timeSlot: '14:00-20:00',
      cancelledAt: formatTimestamp(),
      timestamp: formatTimestamp(), // 添加時間戳用於排序
      uploadTime: Date.now(), // 毫秒級時間戳
      reason: 'user_cancellation'
    };
    
    const content = JSON.stringify(cancellationData, null, 2);
    const encodedContent = safeBase64Encode(content);
    
    console.log('準備上傳取消記錄到GitHub:', {
      filename,
      data: cancellationData,
      encodedLength: encodedContent.length
    });
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `取消餐車預約: ${event.title} - ${event.location} - ${dateStr}`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    console.log('GitHub取消API回應狀態:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('取消預約上傳到GitHub成功:', result);
      
      // 上傳成功後，立即更新index.html和即時數據文件
      try {
        await Promise.all([
          updateIndexHtmlOnGitHub(cancellationData),
          updateRealtimeDataFile()
        ]);
        console.log('取消預約後index.html和即時數據文件更新成功');
      } catch (updateError) {
        console.error('取消預約後更新文件失敗:', updateError);
        // 不影響主要上傳流程，只記錄錯誤
      }
      
      return { success: true, url: result.content.html_url };
    } else {
      const errorText = await response.text();
      console.error('取消預約上傳到GitHub失敗 - 狀態:', response.status);
      console.error('取消預約上傳到GitHub失敗 - 回應:', errorText);
      
      let errorMessage = 'GitHub上傳失敗';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
        console.error('GitHub取消錯誤詳情:', error);
      } catch (e) {
        console.error('無法解析取消錯誤回應:', errorText);
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('取消預約上傳到GitHub錯誤:', error);
    throw error;
  }
}

// 驗證密碼並取消預約
async function verifyPassword() {
  const password = document.getElementById('passwordInput').value;
  const event = window.currentCancelEvent;
  const dateStr = window.currentCancelDate;
  
  if (!password) {
    showToast('error', '密碼錯誤', '請輸入密碼');
    return;
  }
  
  if (password !== 'sky36990') {
    showToast('error', '密碼錯誤', '取消密碼不正確，無法取消預約');
    document.getElementById('passwordInput').value = '';
    return;
  }
  
  // 密碼正確，直接執行取消預約（不再顯示二次確認）
  closePasswordModal();
  
  // 直接執行取消（密碼驗證已經是確認步驟）
  if (true) {
    // 顯示載入提示
    showToast('info', '處理中', '🗑️ 正在為您取消排班...');
    
    // 嘗試從Google Sheets刪除（無論來源，都嘗試刪除）
    try {
      const deleteData = {
        action: 'delete',
        vendor: event.title,
        location: event.location,
        date: dateStr, // ISO格式，Google Apps Script會自動轉換
        rowNumber: event.rowNumber, // 如果有的話
        timestamp: event.timestamp // 可能需要用於查找
      };
      
      console.log('========== 刪除預約 ==========');
      console.log('要刪除的餐車:', event.title);
      console.log('要刪除的場地:', event.location);
      console.log('要刪除的日期:', dateStr);
      console.log('完整刪除數據:', deleteData);
      console.log('事件來源:', event.source);
      console.log('事件rowNumber:', event.rowNumber);
      console.log('🎯 只會刪除符合以上三個條件（餐車+場地+日期）的那一筆');
      console.log('===========================');
      
      const result = await submitToGoogleSheets(deleteData);
      console.log('Google Sheets刪除API回應:', result);
      
      if (result.success) {
        console.log('✅ Google Sheets刪除成功 - 整行已移除（包含所有9個欄位）');
        showToast('success', '刪除成功', `已從 Google Sheets 完整刪除整行資料`);
      } else {
        console.warn('⚠️ Google Sheets刪除可能失敗，但繼續本地刪除');
        showToast('warning', '刪除警告', 'Google Sheets刪除可能失敗，請手動檢查');
      }
    } catch (error) {
      console.error('❌ 從Google Sheets刪除失敗:', error);
      // 即使Sheets刪除失敗，也繼續本地刪除
    }
    
    // 從 allEvents 中移除事件
    const eventIndex = allEvents.findIndex(e => 
      e.title === event.title && 
      e.location === event.location && 
      e.start === event.start
    );
    
    if (eventIndex !== -1) {
      allEvents.splice(eventIndex, 1);
    }
    
    // 不再手動更新 bookedSlots，等待 Google Sheets 同步後自動重建
    // bookedSlots 會在 mergeSheetsDataToCalendar 中清空並重建
    
    // 保存到本地存儲（只保存 allEvents）
    saveToLocalStorage();
    
    // 重新渲染行事曆
    renderCalendar();
    
    // 如果當前選擇的是同一個場地，重新生成可用日期選項
    const currentLocation = document.getElementById('location').value;
    if (currentLocation === event.location) {
      const availableDates = generateAvailableDates(currentLocation);
      const dateSelect = document.getElementById('availableDates');
      dateSelect.innerHTML = '<option value="">選擇可用日期</option>';
      availableDates.forEach(date => {
        const opt = document.createElement('option');
        opt.value = date.value;
        opt.textContent = date.text;
        dateSelect.appendChild(opt);
      });
    }
    
    // 先不顯示成功訊息，等同步確認後再顯示
    
    // 多次同步Google Sheets確認刪除（確保刪除生效）
    // Google Sheets API 可能需要2-3秒處理刪除操作
    setTimeout(async () => {
      try {
        console.log('⏱️ 等待2秒讓 Google Sheets 完成刪除...');
      } catch (error) {
        console.error('延遲錯誤:', error);
      }
    }, 2000);
    
    setTimeout(async () => {
      try {
        console.log('取消後第1次同步（3秒後）...');
        await fetchBookingsFromGoogleSheets();
        await fetchBookedDatesFromSheets();
        mergeSheetsDataToCalendar();
        renderCalendar();
        console.log('取消後第1次同步完成');
        
        // 驗證刪除是否成功
        console.log('🔍 驗證刪除：尋找', {
          餐車: event.title,
          場地: event.location,
          日期: dateStr
        });
        
        const stillExists = allEvents.some(e => {
          const eventDateStr = e.start instanceof Date ? 
            `${e.start.getFullYear()}-${String(e.start.getMonth() + 1).padStart(2, '0')}-${String(e.start.getDate()).padStart(2, '0')}` : 
            (typeof e.start === 'string' ? e.start.split('T')[0] : '');
          
          const matches = e.title === event.title && 
                          e.location === event.location && 
                          eventDateStr === dateStr;
          
          if (matches) {
            console.log('找到匹配:', {
              餐車: e.title,
              場地: e.location,
              日期: eventDateStr
            });
          }
          
          return matches;
        });
        
        console.log('當前 allEvents 總數:', allEvents.length);
        console.log('該餐車同場地的所有預約:', allEvents.filter(e => 
          e.title === event.title && e.location === event.location
        ).map(e => ({
          餐車: e.title,
          日期: e.start instanceof Date ? e.start.toISOString().split('T')[0] : e.start.split('T')[0]
        })));
        
        if (stillExists) {
          console.warn('⚠️ 預約可能還存在，將進行第2次同步...');
        } else {
          console.log('✅ 確認刪除成功 - 指定日期的預約已移除');
          showToast('success', '取消成功', `✅ ${event.title} 的排班已取消\n📅 日期：${dateStr}`);
        }
      } catch (error) {
        console.error('取消後第1次同步失敗:', error);
      }
    }, 3000);
    
    setTimeout(async () => {
      try {
        console.log('取消後第2次同步（5秒後）...');
        await fetchBookingsFromGoogleSheets();
        await fetchBookedDatesFromSheets();
        mergeSheetsDataToCalendar();
        renderCalendar();
        console.log('取消後第2次同步完成');
        
        // 最終驗證
        const stillExists = allEvents.some(e => {
          const eventDateStr = e.start instanceof Date ? 
            `${e.start.getFullYear()}-${String(e.start.getMonth() + 1).padStart(2, '0')}-${String(e.start.getDate()).padStart(2, '0')}` : 
            (typeof e.start === 'string' ? e.start.split('T')[0] : '');
          
          return e.title === event.title && 
                 e.location === event.location && 
                 eventDateStr === dateStr;
        });
        
        if (stillExists) {
          console.error('❌ 刪除可能失敗，預約仍存在');
          showToast('warning', '刪除警告', '預約可能未完全刪除，請手動檢查 Google Sheets');
        } else {
          console.log('✅✅ 最終確認刪除成功');
        }
      } catch (error) {
        console.error('取消後第2次同步失敗:', error);
      }
    }, 5000);
    
    // 第3次確認同步（7秒後）
    setTimeout(async () => {
      try {
        console.log('取消後第3次同步（7秒後）...');
        await fetchBookingsFromGoogleSheets();
        mergeSheetsDataToCalendar();
        renderCalendar();
        console.log('取消後第3次同步完成 - 最終確認');
      } catch (error) {
        console.error('取消後第3次同步失敗:', error);
      }
    }, 7000);
  }
}

// GitHub配置
const GITHUB_CONFIG = {
  token: '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',
  owner: 'sky770825',
  repo: 'foodcarcalss',
  branch: 'main'
};

// Google Sheets配置
// 請將此URL替換為您的Google Apps Script Web App URL
// ========== Supabase 配置 ==========
const SUPABASE_CONFIG = {
  url: 'https://sqgrnowrcvspxhuudrqc.supabase.co',
  anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxZ3Jub3dyY3ZzcHhodXVkcnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMTExNjYsImV4cCI6MjA4Mzc4NzE2Nn0.VMg-7oQTmPapHLGeLzEZ3l_5zcyCZRjJdw_X2J-8kRw',
  enabled: true
};

// 初始化 Supabase 客戶端
let supabaseClient;
if (typeof window.supabase !== 'undefined') {
  supabaseClient = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
  console.log('✅ Supabase 客戶端已初始化');
} else {
  console.error('❌ Supabase 庫未載入，請檢查網路連線');
}

// 全局變數：儲存從 Supabase 讀取的數據
let sheetsBookings = [];
let sheetsBookedDates = {}; // 儲存已預約日期
let lastSheetsSyncTime = null;
let lastBookedDatesSyncTime = null;
let isSyncingWithSheets = false;

// 安全的Base64編碼函數（支援中文字符）
function safeBase64Encode(str) {
  try {
    return btoa(unescape(encodeURIComponent(str)));
  } catch (error) {
    console.error('Base64編碼失敗:', error);
    throw new Error('數據編碼失敗，請檢查數據格式');
  }
}

// 創建GitHub目錄
async function createGitHubDirectory(directoryName) {
  try {
    console.log(`嘗試創建目錄: ${directoryName}`);
    
    // 創建README文件來建立目錄
    const readmeContent = `# ${directoryName}\n\n此目錄用於存儲餐車預約系統的${directoryName === 'bookings' ? '預約' : '取消'}記錄。\n\n## 文件格式\n\n每個文件都是JSON格式，包含預約或取消的詳細信息。`;
    const encodedContent = safeBase64Encode(readmeContent);
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${directoryName}/README.md`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `創建${directoryName}目錄`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    if (response.ok) {
      console.log(`成功創建目錄: ${directoryName}`);
      return true;
    } else {
      const errorText = await response.text();
      console.log(`目錄可能已存在或創建失敗: ${directoryName}`, response.status, errorText);
      return false;
    }
  } catch (error) {
    console.error(`創建目錄失敗: ${directoryName}`, error);
    return false;
  }
}

// 上傳數據到GitHub
async function uploadToGitHub(data, retryCount = 0) {
  const MAX_RETRIES = 3;
  
  try {
    // 確保目錄存在
    await createGitHubDirectory('bookings');
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `bookings/booking-${timestamp}.json`;
    
    // 確保數據包含精確的時間戳
    const dataWithTimestamp = {
      ...data,
      timestamp: formatTimestamp(),
      uploadTime: Date.now() // 毫秒級時間戳，用於精確排序
    };
    
    const content = JSON.stringify(dataWithTimestamp, null, 2);
    const encodedContent = safeBase64Encode(content);
    
    console.log('準備上傳到GitHub:', {
      filename,
      data: dataWithTimestamp,
      encodedLength: encodedContent.length
    });
    
    const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${filename}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `新增餐車預約: ${data.vendor} - ${data.location} - ${data.date}`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    console.log('GitHub API回應狀態:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('GitHub上傳成功:', result);
      
      // 上傳成功後，立即更新index.html和即時數據文件
      try {
        await Promise.all([
          updateIndexHtmlOnGitHub(dataWithTimestamp),
          updateRealtimeDataFile()
        ]);
        console.log('index.html和即時數據文件更新成功');
      } catch (updateError) {
        console.error('更新文件失敗:', updateError);
        // 不影響主要上傳流程，只記錄錯誤
      }
      
      return { success: true, url: result.content.html_url };
    } else {
      const errorText = await response.text();
      console.error('GitHub上傳失敗 - 狀態:', response.status);
      console.error('GitHub上傳失敗 - 回應:', errorText);
      
      let errorMessage = 'GitHub上傳失敗';
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.message || errorMessage;
        console.error('GitHub錯誤詳情:', error);
        
        // 提供更詳細的錯誤信息
        if (response.status === 401) {
          errorMessage = 'GitHub認證失敗 - Token可能已過期，請檢查Token設置';
        } else if (response.status === 403) {
          errorMessage = 'GitHub權限不足 - 請檢查Token權限和倉庫設置';
        } else if (response.status === 422) {
          errorMessage = 'GitHub數據格式錯誤 - 請檢查數據格式';
        } else if (response.status === 404) {
          errorMessage = 'GitHub倉庫不存在 - 請檢查倉庫名稱和權限';
        }
      } catch (e) {
        console.error('無法解析錯誤回應:', errorText);
      }
      
      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error('GitHub上傳錯誤:', error);
    
    // 重試機制
    if (retryCount < MAX_RETRIES && (
      error.name === 'TypeError' || 
      error.message.includes('fetch') ||
      error.message.includes('network')
    )) {
      console.log(`重試上傳 (${retryCount + 1}/${MAX_RETRIES})...`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // 遞增延遲
      return uploadToGitHub(data, retryCount + 1);
    }
    
    // 提供更詳細的錯誤信息
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('網絡連接失敗，請檢查網絡連接');
    } else if (error.message.includes('401')) {
      throw new Error('GitHub認證失敗，請檢查Token');
    } else if (error.message.includes('403')) {
      throw new Error('GitHub權限不足，請檢查倉庫權限');
    } else if (error.message.includes('422')) {
      throw new Error('GitHub數據格式錯誤');
    }
    
    throw error;
  }
}

// 更新GitHub上的index.html文件
async function updateIndexHtmlOnGitHub(bookingData) {
  try {
    console.log('開始更新GitHub上的index.html...');
    
    // 首先獲取當前的index.html內容
    const currentIndexResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/index.html`, {
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    
    if (!currentIndexResponse.ok) {
      throw new Error(`無法獲取當前index.html: ${currentIndexResponse.status}`);
    }
    
    const currentIndexData = await currentIndexResponse.json();
    const currentContent = atob(currentIndexData.content);
    
    // 解析當前內容，找到需要更新的部分
    let updatedContent = currentContent;
    
    // 獲取準確的統計數據
    const accurateStats = await calculateAccurateStats();
    
    // 更新統計信息（如果存在）
    const statsPattern = /<div class="stats">[\s\S]*?<\/div>/;
    const statsMatch = currentContent.match(statsPattern);
    
    if (statsMatch) {
      // 更新統計內容
      const newStats = `<div class="stats">
        <div class="stat-item">
          <i class="fas fa-calendar-check"></i>
          <span>總預約數：${accurateStats.totalBookings}</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-clock"></i>
          <span>今日預約：${accurateStats.todayBookings}</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-map-marker-alt"></i>
          <span>活躍場地：${accurateStats.activeLocations}</span>
        </div>
      </div>`;
      
      updatedContent = updatedContent.replace(statsPattern, newStats);
    }
    
    // 移除右下角的最後更新時間顯示（用戶要求隱藏）
    // 清理可能存在的右下角時間顯示
    const timeDisplayPattern = /<div style="position: fixed; bottom: 10px; right: 10px; background: rgba\(0,0,0,0\.7\); color: white; padding: 5px 10px; border-radius: 5px; font-size: 12px; z-index: 1000;">[\s\S]*?<\/div>/g;
    updatedContent = updatedContent.replace(timeDisplayPattern, '');
    
    // 清理可能存在的系統信息註釋
    const systemInfoPattern = /<!-- 系統信息 -->[\s\S]*?<\/div>/g;
    updatedContent = updatedContent.replace(systemInfoPattern, '');
    
    // 編碼更新後的內容
    const encodedUpdatedContent = safeBase64Encode(updatedContent);
    
    // 上傳更新後的index.html
    const updateResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/index.html`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `更新index.html - ${bookingData.action === 'cancellation' ? '取消預約' : '新增預約'}: ${bookingData.vendor} - ${bookingData.location} - ${bookingData.date}`,
        content: encodedUpdatedContent,
        branch: GITHUB_CONFIG.branch,
        sha: currentIndexData.sha // 需要提供當前的SHA以更新文件
      })
    });
    
    if (updateResponse.ok) {
      const updateResult = await updateResponse.json();
      console.log('index.html更新成功:', updateResult);
      return { success: true, url: updateResult.content.html_url };
    } else {
      const errorText = await updateResponse.text();
      console.error('更新index.html失敗 - 狀態:', updateResponse.status);
      console.error('更新index.html失敗 - 回應:', errorText);
      throw new Error(`更新index.html失敗: ${updateResponse.status}`);
    }
    
  } catch (error) {
    console.error('更新GitHub上的index.html時發生錯誤:', error);
    throw error;
  }
}

// 更新即時數據文件
async function updateRealtimeDataFile() {
  try {
    console.log('開始更新即時數據文件...');
    
    // 獲取所有預約數據
    const allBookings = await fetchBookingsFromGitHub();
    
    // 計算統計數據
    const stats = await calculateAccurateStats();
    
    // 準備即時數據
    const realtimeData = {
      lastUpdated: formatTimestamp(),
      stats: stats,
      bookings: allBookings,
      summary: {
        totalBookings: stats.totalBookings,
        todayBookings: stats.todayBookings,
        activeLocations: stats.activeLocations,
        locations: [
          '四維路59號',
          '四維路60號', 
          '漢堡大亨 - 四維路70號',
          '自由風 - 四維路190號',
          '蔬蒔 - 四維路216號',
          '金正好吃 - 四維路218號'
        ]
      }
    };
    
    // 編碼數據
    const content = JSON.stringify(realtimeData, null, 2);
    const encodedContent = safeBase64Encode(content);
    
    // 上傳到GitHub
    const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/data/realtime.json`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: `更新即時數據 - ${new Date().toLocaleString('zh-TW')}`,
        content: encodedContent,
        branch: GITHUB_CONFIG.branch
      })
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('即時數據文件更新成功:', result);
      return { success: true, url: result.content.html_url };
    } else {
      const errorText = await response.text();
      console.error('即時數據文件更新失敗 - 狀態:', response.status);
      console.error('即時數據文件更新失敗 - 回應:', errorText);
      throw new Error(`即時數據文件更新失敗: ${response.status}`);
    }
    
  } catch (error) {
    console.error('更新即時數據文件時發生錯誤:', error);
    throw error;
  }
}

// 計算準確的統計數據
async function calculateAccurateStats() {
  try {
    console.log('開始計算準確的統計數據...');
    
    // 獲取所有預約和取消記錄
    const allBookings = await fetchBookingsFromGitHub();
    
    // 計算統計數據
    let totalBookings = 0;
    let todayBookings = 0;
    const activeLocations = new Set();
    const today = new Date().toISOString().split('T')[0];
    
    // 按時間戳排序，確保正確處理取消操作
    allBookings.sort((a, b) => {
      const timeA = a.uploadTime || new Date(a.timestamp).getTime();
      const timeB = b.uploadTime || new Date(b.timestamp).getTime();
      return timeA - timeB;
    });
    
    // 追蹤每個預約的狀態
    const bookingStates = new Map();
    
    for (const booking of allBookings) {
      const bookingKey = `${booking.vendor}-${booking.location}-${booking.date}`;
      
      if (booking.action === 'cancellation') {
        // 取消預約
        if (bookingStates.has(bookingKey)) {
          bookingStates.delete(bookingKey);
        }
      } else {
        // 新增預約
        bookingStates.set(bookingKey, booking);
      }
    }
    
    // 計算最終統計
    for (const [key, booking] of bookingStates) {
      totalBookings++;
      activeLocations.add(booking.location);
      
      // 檢查是否為今日預約
      const bookingDate = booking.date.split('T')[0];
      if (bookingDate === today) {
        todayBookings++;
      }
    }
    
    const stats = {
      totalBookings,
      todayBookings,
      activeLocations: activeLocations.size
    };
    
    console.log('統計數據計算完成:', stats);
    return stats;
    
  } catch (error) {
    console.error('計算統計數據時發生錯誤:', error);
    // 返回默認值
    return {
      totalBookings: 0,
      todayBookings: 0,
      activeLocations: 6
    };
  }
}

// 從GitHub獲取所有預約數據
async function fetchBookingsFromGitHub() {
  try {
    const bookings = [];
    
    // 獲取預約數據
    try {
      console.log('開始從GitHub獲取預約數據...');
      const bookingsResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/bookings`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      console.log('GitHub bookings目錄回應狀態:', bookingsResponse.status);
      
      if (bookingsResponse.ok) {
        const files = await bookingsResponse.json();
        console.log('找到預約文件數量:', files.length);
        
        for (const file of files) {
          if (file.name.endsWith('.json')) {
            console.log('處理文件:', file.name);
            const fileResponse = await fetch(file.download_url);
            if (fileResponse.ok) {
              const booking = await fileResponse.json();
              bookings.push(booking);
              console.log('成功載入預約:', booking.vendor, booking.date);
            } else {
              console.error('載入文件失敗:', file.name, fileResponse.status);
            }
          }
        }
      } else {
        const errorText = await bookingsResponse.text();
        console.error('獲取bookings目錄失敗:', bookingsResponse.status, errorText);
      }
    } catch (error) {
      console.error('獲取預約數據失敗:', error);
    }
    
    // 獲取取消記錄
    try {
      const cancellationsResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/cancellations`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (cancellationsResponse.ok) {
        const files = await cancellationsResponse.json();
        
        for (const file of files) {
          if (file.name.endsWith('.json')) {
            const fileResponse = await fetch(file.download_url);
            if (fileResponse.ok) {
              const cancellation = await fileResponse.json();
              // 將取消記錄轉換為負面預約記錄
              const negativeBooking = {
                vendor: cancellation.vendor,
                location: cancellation.location,
                date: cancellation.date,
                timeSlot: cancellation.timeSlot,
                action: 'cancelled',
                cancelledAt: cancellation.cancelledAt
              };
              bookings.push(negativeBooking);
            }
          }
        }
      }
    } catch (error) {
      console.error('獲取取消記錄失敗:', error);
    }
    
    return bookings;
  } catch (error) {
    console.error('獲取GitHub數據錯誤:', error);
    return [];
  }
}

// =============== Google Sheets 同步功能 ===============

// 提交預約到 Supabase
async function submitToGoogleSheets(formData) {
  // 檢查是否啟用 Supabase 同步
  if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
    console.log('Supabase 同步未啟用或客戶端未初始化');
    return { success: false, message: 'Supabase 同步未啟用' };
  }
  
  try {
    console.log('提交數據到 Supabase:', formData);
    
    // 處理不同的操作類型
    if (formData.action === 'takeover') {
      // 接手預約：更新現有預約的餐車資訊
      // 先讀取原有的付款狀態，保持已付款的狀態
      const { data: existingBooking, error: fetchError } = await supabaseClient
        .from('foodcarcalss')
        .select('payment')
        .eq('id', formData.rowNumber)
        .single();
      
      if (fetchError) throw fetchError;
      
      // 如果原本是已付款，保持已付款狀態；否則設為未繳款
      const currentPayment = existingBooking.payment || '';
      const isPaid = currentPayment === '己繳款' || currentPayment === '已付款';
      const preservedPayment = isPaid ? currentPayment : '未繳款';
      
      console.log(`接手預約 - 原有付款狀態: ${currentPayment}, 保持狀態: ${preservedPayment}`);
      
      const { data, error } = await supabaseClient
        .from('foodcarcalss')
        .update({
          vendor: formData.vendor,
          food_type: formData.foodType,
          payment: preservedPayment // 保持原有付款狀態（已付款保持，未付款設為未繳款）
        })
        .eq('id', formData.rowNumber)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, message: '預約已成功接手', booking: data };
    }
    
    if (formData.action === 'transfer') {
      // 排班釋出：更新為新的餐車資訊
      const recordId = formData.rowNumber;
      if (recordId == null || recordId === '') {
        throw new Error('缺少預約 ID，無法執行釋出');
      }
      const { data, error } = await supabaseClient
        .from('foodcarcalss')
        .update({
          vendor: formData.vendor,
          food_type: formData.foodType,
          payment: '未繳款' // 釋出後需要重新付款
        })
        .eq('id', recordId)
        .select()
        .single();
      
      if (error) {
        console.error('Supabase 釋出更新失敗:', error);
        throw error;
      }
      if (!data) {
        throw new Error('更新成功但未回傳資料，請重新整理頁面確認');
      }
      return { success: true, message: '排班已成功釋出', booking: data };
    }
    
    if (formData.action === 'delete') {
      // 刪除預約
      const { error } = await supabaseClient
        .from('foodcarcalss')
        .delete()
        .eq('id', formData.rowNumber);
      
      if (error) throw error;
      return { success: true, message: '預約已成功刪除' };
    }
    
    if (formData.action === 'updatePayment') {
      // 更新付款狀態
      const { data, error } = await supabaseClient
        .from('foodcarcalss')
        .update({ payment: formData.payment })
        .eq('id', formData.rowNumber)
        .select()
        .single();
      
      if (error) throw error;
      return { success: true, message: '付款狀態已更新', booking: data };
    }
    
    // 新增預約（預設操作）
    // 格式化日期為「10月13日(星期一)」格式
    function formatDateForDisplay(dateStr) {
      if (!dateStr) return '';
      try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          // 如果無法解析，直接返回原值
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
    
    const bookingData = {
      timestamp: formData.timestamp || new Date().toISOString(),
      vendor: formData.vendor,
      food_type: formData.foodType || '',
      location: formData.location,
      booking_date: formatDateForDisplay(formData.date) || formData.date,
      status: '己排',
      fee: formData.fee || '600元/天',
      payment: '尚未付款',
      note: '',
      payment_image_url: formData.paymentImageUrl || null // 添加匯款圖片 URL
    };
    
    const { data, error } = await supabaseClient
      .from('foodcarcalss')
      .insert(bookingData)
      .select()
      .single();
    
    if (error) throw error;
    
    console.log('✅ Supabase 新增預約成功:', data);
    
    // 保存當前預約 ID 和完整資訊，供繳費彈窗使用
    currentBookingId = data.id;
    console.log('📝 已保存預約 ID 到 currentBookingId:', currentBookingId);
    
    return { 
      success: true, 
      message: '預約已成功提交', 
      booking: data  // 確保返回完整的預約資料
    };
    
  } catch (error) {
    console.error('Supabase 提交失敗:', error);
    throw new Error('無法連接到 Supabase: ' + error.message);
  }
}

// 從 Supabase 讀取所有預約數據
async function fetchBookingsFromGoogleSheets() {
  // 檢查是否啟用 Supabase 同步
  if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
    console.log('Supabase 同步未啟用或客戶端未初始化');
    return [];
  }
  
  // 防止重複同步
  if (isSyncingWithSheets) {
    console.log('正在同步中，跳過本次請求');
    return sheetsBookings;
  }
  
  isSyncingWithSheets = true;
  
  try {
    console.log('從 Supabase 讀取預約數據...');
    
    // 從 Supabase 獲取資料
    const { data, error } = await supabaseClient
      .from('foodcarcalss')
      .select('*')
      .order('booking_date', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    // 轉換為與 Google Sheets 相同的格式
    const result = {
      success: true,
      bookings: (data || []).map(row => ({
        timestamp: row.timestamp || new Date().toISOString(),
        vendor: row.vendor || '',
        foodType: row.food_type || '',
        location: row.location || '',
        date: row.booking_date || '',
        status: row.status || '己排',
        bookedStatus: row.status || '己排',
        fee: row.fee || '600元/天',
        payment: row.payment || '未繳款',
        note: row.note || '',
        id: row.id,
        rowNumber: row.id // 為了向後兼容
      })),
      lastUpdate: new Date().toISOString()
    };
    
    console.log('Supabase 回應:', result);
    
    if (result.success && result.bookings) {
      sheetsBookings = result.bookings;
      lastSheetsSyncTime = formatTimestamp();
      console.log(`✅ 成功從 Supabase 獲取 ${sheetsBookings.length} 條預約記錄`);
      
      // ✅ 診斷：檢查前3筆數據
      if (sheetsBookings.length > 0) {
        console.log('📊 診斷：檢查 Supabase 返回的數據');
        for (let i = 0; i < Math.min(3, sheetsBookings.length); i++) {
          const booking = sheetsBookings[i];
          console.log(`  預約 #${i + 1}:`, booking.vendor);
          console.log(`    - id:`, booking.id, `(類型: ${typeof booking.id})`);
          console.log(`    - location:`, booking.location);
          console.log(`    - date:`, booking.date);
        }
      }
      
      return sheetsBookings;
    } else {
      console.warn('Supabase 回應格式異常:', result);
      return sheetsBookings; // 返回之前的數據，不要清空
    }
    
  } catch (error) {
    console.error('從 Supabase 讀取失敗:', error);
    // 返回之前的數據，避免清空
    return sheetsBookings;
  } finally {
    isSyncingWithSheets = false;
  }
}

// 場地名稱標準化對照表（處理不同格式的場地名稱）
const locationNameMapping = {
  // Google Sheets 可能的格式 → 系統標準格式
  "四維路59號": "四維路59號",
  "楊梅區四維路59號": "四維路59號",
  "四維路60號": "四維路60號",
  "楊梅區四維路60號": "四維路60號",
  "漢堡大亨": "漢堡大亨",
  "漢堡大亨 - 四維路70號": "漢堡大亨",
  "四維路70號": "漢堡大亨",
  "楊梅區四維路70號": "漢堡大亨",
  "自由風": "自由風",
  "自由風 - 四維路190號": "自由風",
  "四維路190號": "自由風",
  "楊梅區四維路190號": "自由風",
  "蔬蒔": "蔬蒔",
  "蔬蒔 - 四維路216號": "蔬蒔",
  "四維路216號": "蔬蒔",
  "楊梅區四維路216號": "蔬蒔",
  "金正好吃": "金正好吃",
  "金正好吃 - 四維路218號": "金正好吃",
  "四維路218號": "金正好吃",
  "楊梅區四維路218號": "金正好吃"
};

// 標準化場地名稱
function normalizeLocationName(locationName) {
  if (!locationName) return locationName;
  
  // 移除多餘空格和全形空格
  let trimmed = locationName.trim().replace(/\s+/g, '');
  
  // 移除"楊梅區"前綴（如果有）
  trimmed = trimmed.replace(/^楊梅區/, '');
  
  // 查找對照表（先精確匹配）
  if (locationNameMapping[locationName.trim()]) {
    return locationNameMapping[locationName.trim()];
  }
  
  // 查找對照表（無空格版本）
  if (locationNameMapping[trimmed]) {
    return locationNameMapping[trimmed];
  }
  
  // 如果沒有在對照表中，嘗試智能匹配（根據門牌號碼）
  if (trimmed.includes('70號') || trimmed.includes('漢堡')) {
    return '漢堡大亨';
  }
  if (trimmed.includes('190號') || trimmed.includes('自由風')) {
    return '自由風';
  }
  if (trimmed.includes('216號') || trimmed.includes('蔬蒔')) {
    return '蔬蒔';
  }
  if (trimmed.includes('218號') || trimmed.includes('金正好吃')) {
    return '金正好吃';
  }
  if (trimmed.includes('59號')) {
    return '四維路59號';
  }
  if (trimmed.includes('60號')) {
    return '四維路60號';
  }
  
  // 如果都無法匹配，返回原始名稱
  console.warn(`⚠️ 無法標準化場地名稱: "${locationName}"`);
  return locationName.trim();
}

// 將 Supabase 數據合併到日曆（v2.7：完全替換模式 + 場地名稱標準化 + 去重）
function mergeSheetsDataToCalendar() {
  console.log('========================================');
  console.log('📥 從 Supabase 同步數據（v2.7 - 場地名稱標準化 + 去重）');
  console.log('========================================');
  
  // v2.3.0：完全清空所有數據，只保留 Google Sheets 的數據
  console.log('🧹 清空所有本地數據...');
  allEvents.length = 0;
  Object.keys(bookedSlots).forEach(location => {
    bookedSlots[location] = {};
  });
  
  if (!sheetsBookings || sheetsBookings.length === 0) {
    console.log('⚠️ 沒有 Supabase 數據');
    console.log('✅ 日曆將顯示為空');
    renderCalendar();
    return;
  }
  
  console.log(`📊 準備載入 ${sheetsBookings.length} 條 Supabase 記錄（將自動去重）`);
  console.log(`📋 前3筆數據樣本:`);
  sheetsBookings.slice(0, 3).forEach((b, i) => {
    console.log(`  ${i+1}. ${b.vendor || '(無餐車名)'} | ${b.location || '(無場地)'} | ${b.date || '(無日期)'} | ID: ${b.id !== undefined ? b.id : 'undefined'}`);
  });
  
  let addedCount = 0;
  let skippedCount = 0;
  
  // v2.7.0：直接添加所有Google Sheets數據，並標準化場地名稱
  // ✅ 添加去重邏輯：使用 Map 追蹤已添加的預約（基於 ID）
  const seenIds = new Set(); // 用於追蹤已處理的 ID
  let duplicateCount = 0;
  
  sheetsBookings.forEach((booking, index) => {
    // ✅ 去重檢查：優先使用 id（Supabase 主鍵）
    // 只有當 id 存在且不為 null/undefined 時才使用 id 去重
    const bookingId = booking.id !== undefined && booking.id !== null ? booking.id : 
                      (booking.rowNumber !== undefined && booking.rowNumber !== null ? booking.rowNumber : null);
    
    if (bookingId !== null) {
      // 使用 ID 去重（最準確）
      if (seenIds.has(bookingId)) {
        console.warn(`⚠️ 跳過重複預約（相同ID）: ${booking.vendor} - ${booking.location} - ${booking.date} (ID: ${bookingId})`);
        duplicateCount++;
        return;
      }
      seenIds.add(bookingId);
    } else {
      // 如果沒有 ID，使用 location+date+vendor 組合去重（備用方案）
      const fallbackKey = `${booking.location}|${booking.date}|${booking.vendor}`;
      if (seenIds.has(fallbackKey)) {
        console.warn(`⚠️ 跳過重複預約（相同內容）: ${booking.vendor} - ${booking.location} - ${booking.date} (無ID)`);
        duplicateCount++;
        return;
      }
      seenIds.add(fallbackKey);
    }
    
    // 解析日期格式（例如：10月16日(星期四)）
    if (!booking.date || booking.date.trim() === '') {
      console.warn(`❌ 日期為空 - 跳過: ${booking.vendor} (ID: ${booking.id || booking.rowNumber || 'N/A'})`);
      skippedCount++;
      return;
    }
    
    const dateMatch = booking.date.match(/(\d+)月(\d+)日/);
    if (!dateMatch) {
      console.warn(`❌ 無法解析日期格式: "${booking.date}" - 跳過: ${booking.vendor} (ID: ${booking.id || booking.rowNumber || 'N/A'})`);
      skippedCount++;
      return;
    }
    
    const month = parseInt(dateMatch[1]);
    const day = parseInt(dateMatch[2]);
    
    // 根據時間戳記判斷年份：時間戳記 + 3 個月內的日期
    let year;
    if (booking.timestamp) {
      const timestampDate = new Date(booking.timestamp);
      const timestampYear = timestampDate.getFullYear();
      const timestampMonth = timestampDate.getMonth() + 1;
      
      // 計算預約日期可能的年份範圍（從時間戳記到 +3 個月）
      // 例如：11月登記 → 可預約 11月、12月、1月
      if (month >= timestampMonth) {
        year = timestampYear;
      } else if (timestampMonth >= 10 && month <= 3) {
        year = timestampYear + 1;
      } else {
        year = timestampYear;
      }
    } else {
      year = new Date().getFullYear();
    }
    
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    // 標準化場地名稱
    const originalLocation = booking.location;
    const normalizedLocation = normalizeLocationName(booking.location);
    
    if (originalLocation !== normalizedLocation) {
      console.log(`🔄 場地名稱標準化: "${originalLocation}" → "${normalizedLocation}"`);
    }
    
    // 檢查是否為有效場地
    if (!locationConfigs[normalizedLocation]) {
      console.warn(`⚠️ 未知場地: "${booking.location}" (標準化: "${normalizedLocation}") - 跳過: ${booking.vendor} (ID: ${booking.id || booking.rowNumber || 'N/A'})`);
      console.warn(`   可用場地列表:`, Object.keys(locationConfigs).join(', '));
      skippedCount++;
      return;
    }
    
    // v2.7.0：直接添加事件，使用標準化後的場地名稱
    const newEvent = {
      title: booking.vendor,
      start: dateStr,
      location: normalizedLocation, // 使用標準化後的名稱
      color: '#17a2b8', // 用不同顏色標示來自Sheets的數據
      timestamp: booking.timestamp,
      foodType: booking.foodType,
      fee: booking.fee,
      payment: booking.payment,
      bookedStatus: booking.bookedStatus, // 己排狀態
      note: booking.note,
      source: 'google_sheets', // 標記來源
      rowNumber: booking.rowNumber || booking.id || null, // ✅ 保存行號或ID，用於後續更新
      id: booking.id || booking.rowNumber || null, // ✅ 保存 Supabase ID
      originalLocation: originalLocation // 保存原始場地名稱
    };
    
    // ✅ 診斷：檢查前幾筆數據的詳細信息
    if (index < 5) { // 顯示前5筆以便診斷
      console.log(`✅ 成功處理事件 #${index + 1}:`);
      console.log(`  - 餐車: ${booking.vendor}`);
      console.log(`  - ID: ${booking.id !== undefined ? booking.id : 'undefined'} (類型: ${typeof booking.id})`);
      console.log(`  - rowNumber: ${booking.rowNumber !== undefined ? booking.rowNumber : 'undefined'}`);
      console.log(`  - 場地: ${booking.location}`);
      console.log(`  - 日期: ${booking.date}`);
      console.log(`  - 標準化場地: ${normalizedLocation}`);
      console.log(`  - 解析後日期: ${dateStr}`);
    }
    
    allEvents.push(newEvent);
    
    // 更新bookedSlots（使用標準化後的名稱）
    if (!bookedSlots[normalizedLocation]) {
      bookedSlots[normalizedLocation] = {};
    }
    if (!bookedSlots[normalizedLocation][dateStr]) {
      bookedSlots[normalizedLocation][dateStr] = [];
    }
    bookedSlots[normalizedLocation][dateStr].push('14:00-20:00');
    
    addedCount++;
  });
  
  // v2.7.0：顯示載入統計（包含跳過的資料）
  
  console.log('========================================');
  console.log(`✅ Supabase 數據載入完成`);
  console.log(`📊 原始數據: ${sheetsBookings.length} 筆`);
  console.log(`✅ 成功載入: ${addedCount} 個預約`);
  if (duplicateCount > 0) {
    console.warn(`⚠️ 發現並跳過: ${duplicateCount} 筆重複資料`);
  }
  if (skippedCount > 0) {
    console.warn(`⚠️ 跳過: ${skippedCount} 筆資料（場地名稱不匹配或日期格式錯誤）`);
    console.warn(`💡 請在控制台執行 checkSheetsLocationNames() 查看詳情`);
  }
  if (addedCount === 0 && sheetsBookings.length > 0) {
    console.error(`❌ 警告：有 ${sheetsBookings.length} 筆數據但沒有成功載入任何預約！`);
    console.error(`   可能原因：`);
    console.error(`   1. 日期格式無法解析`);
    console.error(`   2. 場地名稱無法匹配`);
    console.error(`   3. 所有數據都被判定為重複`);
    console.error(`   請檢查控制台中的詳細日誌`);
  }
  console.log('========================================');
  
  if (addedCount > 0) {
    // 顯示每個場地的預約數量
    const locationCounts = {};
    allEvents.forEach(event => {
      locationCounts[event.location] = (locationCounts[event.location] || 0) + 1;
    });
    
    console.log('📍 各場地預約數量:');
    Object.keys(locationCounts).forEach(location => {
      console.log(`   ${location}: ${locationCounts[location]} 個預約`);
    });
    
    // 檢查是否有場地沒有預約
    const allLocations = Object.keys(locationConfigs);
    const missingLocations = allLocations.filter(loc => !locationCounts[loc]);
    if (missingLocations.length > 0) {
      console.log('\n📭 以下場地目前無預約:');
      missingLocations.forEach(loc => {
        console.log(`   • ${loc}`);
      });
    }
    
    console.log('========================================');
    
    renderCalendar(); // 重新渲染日曆
    // v2.3.0：不再保存到localStorage，避免舊數據污染
  } else {
    console.log('⚠️ 沒有載入任何預約數據');
    renderCalendar(); // 顯示空日曆
  }
}

// 定期從Google Sheets同步數據
let sheetsSyncInterval = null;
let paymentCountdownInterval = null;

function startSheetsSyncInterval() {
  if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
    console.log('Supabase 自動同步未啟用或客戶端未初始化');
    return;
  }
  
  // 清除舊的同步計時器
  if (sheetsSyncInterval) {
    clearInterval(sheetsSyncInterval);
  }
  
  // 設置新的同步計時器（30秒）
  const syncInterval = 30000;
  sheetsSyncInterval = setInterval(async () => {
    console.log('定期同步 Supabase 數據...');
    try {
      // 同時同步完整預約數據和已預約日期
      await Promise.all([
        fetchBookingsFromGoogleSheets(),
        fetchBookedDatesFromSheets()
      ]);
      mergeSheetsDataToCalendar();
      // 保存到快取
      saveToLocalStorage();
      console.log('✅ 定期同步完成，已更新快取');
    } catch (error) {
      console.error('定期同步失敗:', error);
    }
  }, syncInterval);
  
  console.log(`已啟動 Supabase 定期同步，間隔: ${syncInterval/1000}秒`);
  
  // 啟動付款倒計時更新器（每分鐘更新一次）
  if (paymentCountdownInterval) {
    clearInterval(paymentCountdownInterval);
  }
  
  paymentCountdownInterval = setInterval(() => {
    // 只更新日曆顯示，不重新fetch數據
    renderCalendar();
  }, 60000); // 每60秒更新一次倒計時
  
  console.log('已啟動付款倒計時更新器');
}

// 手動觸發Google Sheets同步
async function syncGoogleSheets() {
  console.log('手動同步 Supabase...');
  showToast('info', '更新中', '🔄 正在更新最新排班資訊...');
  
  try {
    // 同時同步完整預約數據和已預約日期
    await Promise.all([
      fetchBookingsFromGoogleSheets(),
      fetchBookedDatesFromSheets()
    ]);
    mergeSheetsDataToCalendar();
    
    // 保存到快取
    saveToLocalStorage();
    
    // 計算已預約總數
    let totalBooked = 0;
    for (const location in sheetsBookedDates) {
      totalBooked += sheetsBookedDates[location].length;
    }
    
    showToast('success', '更新成功', `✅ 已更新 ${sheetsBookings.length} 個排班，${totalBooked} 個已預約檔期`);
    
    // 重新生成當前場地的可用日期
    const currentLoc = document.getElementById('location').value;
    if (currentLoc) {
      document.getElementById('location').dispatchEvent(new Event('change'));
    }
    
    // 檢查是否有逾期未付款的預約
    checkOverduePayments();
  } catch (error) {
    console.error('同步失敗:', error);
    showToast('error', '更新失敗', '網路連線異常，請稍後再試');
  }
}

// 檢查逾期未付款的預約
function checkOverduePayments() {
  if (!allEvents || allEvents.length === 0) return;
  
  const now = new Date();
  const overdueEvents = [];
  const urgentEvents = [];
  
  allEvents.forEach(event => {
    // 只檢查尚未付款的預約
    if (event.payment !== '已付款' && event.timestamp) {
      const bookingTime = new Date(event.timestamp);
      const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000);
      const timeLeft = deadline - now;
      
      if (timeLeft < 0) {
        // 已逾期
        overdueEvents.push(event);
      } else if (timeLeft < 6 * 60 * 60 * 1000) {
        // 少於6小時
        urgentEvents.push(event);
      }
    }
  });
  
  // 顯示提醒
  if (overdueEvents.length > 0) {
    console.warn(`⚠️ 發現 ${overdueEvents.length} 個逾期未付款的預約：`);
    overdueEvents.forEach(e => {
      console.warn(`  - ${e.title} (${e.location})`);
    });
  }
  
  if (urgentEvents.length > 0) {
    console.warn(`⏰ 發現 ${urgentEvents.length} 個即將逾期的預約：`);
    urgentEvents.forEach(e => {
      const bookingTime = new Date(e.timestamp);
      const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000);
      const timeLeft = deadline - new Date();
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      console.warn(`  - ${e.title} (${e.location}) - 剩餘 ${hoursLeft} 小時`);
    });
  }
}

// 從 Supabase 獲取已預約日期
async function fetchBookedDatesFromSheets() {
  // 檢查是否啟用 Supabase 同步
  if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
    console.log('Supabase 同步未啟用或客戶端未初始化');
    return {};
  }
  
  try {
    console.log('從 Supabase 讀取已預約日期...');
    
    // 從 Supabase 獲取所有預約
    const { data, error } = await supabaseClient
      .from('foodcarcalss')
      .select('location, booking_date, payment');
    
    if (error) {
      throw error;
    }
    
    // 轉換為與 Google Sheets 相同的格式
    const bookedDates = {};
    
    (data || []).forEach(booking => {
      if (!booking.location || !booking.booking_date) return;
      
      if (!bookedDates[booking.location]) {
        bookedDates[booking.location] = [];
      }
      
      // 解析日期格式
      let standardDate = '';
      if (booking.booking_date.includes('月') && booking.booking_date.includes('日')) {
        const match = booking.booking_date.match(/(\d+)月(\d+)日/);
        if (match) {
          const year = new Date().getFullYear();
          const month = String(parseInt(match[1])).padStart(2, '0');
          const day = String(parseInt(match[2])).padStart(2, '0');
          standardDate = `${year}-${month}-${day}`;
        }
      } else if (booking.booking_date.includes('-')) {
        standardDate = booking.booking_date.split('T')[0];
      }
      
      if (standardDate) {
        bookedDates[booking.location].push({
          standardDate: standardDate,
          date: booking.booking_date,
          payment: booking.payment || '未繳款'
        });
      }
    });
    
    sheetsBookedDates = bookedDates;
    lastBookedDatesSyncTime = formatTimestamp();
    
    // 計算總預約數
    let totalBooked = 0;
    for (const location in sheetsBookedDates) {
      totalBooked += sheetsBookedDates[location].length;
    }
    
    console.log(`✅ 成功獲取已預約日期，共 ${totalBooked} 個預約`);
    return sheetsBookedDates;
    
  } catch (error) {
    console.error('從 Supabase 讀取已預約日期失敗:', error);
    return sheetsBookedDates; // 返回之前的數據
  }
}

// 暴露到全局，供控制台調試使用
window.syncGoogleSheets = syncGoogleSheets;
window.fetchBookingsFromGoogleSheets = fetchBookingsFromGoogleSheets;
window.fetchBookedDatesFromSheets = fetchBookedDatesFromSheets;
window.sheetsBookings = () => sheetsBookings;
window.sheetsBookedDates = () => sheetsBookedDates;

// =============== End of Google Sheets 同步功能 ===============

// 獲取國定假日名稱
function getHolidayName(dateStr) {
  const holidayMap = {
    '2025-01-01': '元旦',
    '2025-01-28': '春節',
    '2025-01-29': '春節',
    '2025-01-30': '春節',
    '2025-02-28': '和平紀念日',
    '2025-04-04': '兒童節',
    '2025-04-05': '清明節',
    '2025-05-01': '勞動節',
    '2025-06-14': '端午節',
    '2025-09-27': '中秋節',
    '2025-10-10': '國慶日',
    '2025-12-25': '聖誕節'
  };
  return holidayMap[dateStr] || '國定假日';
}

// 時間控制檢查函數（獨立條件）
// 開放範圍：當前月份～當前+3個月（共 4 個月可預約）
// 例如：3月 → 開放 3、4、5、6 月；4月 → 開放 4、5、6、7 月
function checkTimeControl(targetYear, targetMonth, currentYear, currentMonth, currentDay) {
  // 總是允許當前月份
  if (targetYear === currentYear && targetMonth === currentMonth) {
    return true;
  }
  
  // 將目標與當前轉為可比較的數值（年*12+月）
  const targetVal = targetYear * 12 + targetMonth;
  const currentVal = currentYear * 12 + currentMonth;
  
  // 允許：當前月份 ～ 當前+3個月（含）
  const maxAllowedVal = currentVal + 3;
  
  if (targetVal >= currentVal && targetVal <= maxAllowedVal) {
    return true;
  }
  
  return false;
}

// 場地選擇事件
document.getElementById('location').addEventListener('change', async () => {
  const loc = document.getElementById('location').value;
  const dateInput = document.getElementById('date');
  const dateSelect = document.getElementById('availableDates');
  const dateInfo = document.getElementById('dateInfo');
  
  // 同步更新行事曆篩選和上方場地分頁
  if (loc) {
    currentFilter = loc;
    
    // 更新行事曆篩選按鈕的active狀態
    document.querySelectorAll('.location-filter .filter-btn').forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.location === loc) {
        btn.classList.add('active');
      }
    });
    
    // 更新上方場地分頁的active狀態
    document.querySelectorAll('.location-tab').forEach(tab => {
      tab.classList.remove('active');
      if (tab.dataset.location === loc) {
        tab.classList.add('active');
      }
    });
    
    // 更新場地資訊顯示
    updateLocationInfo(loc);
    
    // 立即重新渲染行事曆（不等待）
    renderCalendar();
  }
  
  // 重置
  dateInput.value = '';
  dateInput.style.display = 'none';
  dateSelect.style.display = 'block';
  dateInfo.style.display = 'block';
  
  if (!loc) {
    dateSelect.style.display = 'none';
    dateInfo.style.display = 'none';
    return;
  }
  
  const locationConfig = locationConfigs[loc];
  if (!locationConfig) {
    return;
  }
  
  // 先用本地數據快速生成選項（立即響應）
  const quickAvailableDates = generateAvailableDates(loc);
  
  if (quickAvailableDates.length > 0) {
    // 立即更新選項（使用本地數據）
    dateSelect.innerHTML = '<option value="">選擇可用日期</option>';
    quickAvailableDates.forEach(date => {
      const opt = document.createElement('option');
      opt.value = date.value;
      opt.textContent = date.text;
      dateSelect.appendChild(opt);
    });
    
    // 更新提示訊息
    if (locationConfig.days.length < 7) {
      const dayNames = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];
      const allowedDays = locationConfig.days.map(day => dayNames[day]).join('、');
      dateInfo.innerHTML = `<small><i class="fas fa-info-circle"></i> 該場地僅限${allowedDays}營業</small>`;
    } else {
      dateInfo.innerHTML = '<small><i class="fas fa-info-circle"></i> 該場地整個月都可以排班</small>';
    }
  } else {
    dateInfo.innerHTML = '<small><i class="fas fa-exclamation-triangle"></i> 該場地近期無可用日期</small>';
  }
  
  // 在背景從 Supabase 獲取最新數據並更新（異步，不阻塞UI）
  if (SUPABASE_CONFIG.enabled && supabaseClient) {
    // 延遲執行，不阻塞UI
    setTimeout(async () => {
      try {
        await fetchBookedDatesFromSheets();
        console.log(`✅ 已更新場地 ${loc} 的已預約日期`);
        
        // 重新生成選項（使用最新數據）
        const updatedAvailableDates = generateAvailableDates(loc);
        
        // 只有在選項有變化時才更新
        if (JSON.stringify(updatedAvailableDates) !== JSON.stringify(quickAvailableDates)) {
          dateSelect.innerHTML = '<option value="">選擇可用日期</option>';
          updatedAvailableDates.forEach(date => {
            const opt = document.createElement('option');
            opt.value = date.value;
            opt.textContent = date.text;
            dateSelect.appendChild(opt);
          });
          console.log('📅 日期選項已更新（來自Google Sheets最新數據）');
        }
      } catch (error) {
        console.error('背景獲取已預約日期失敗:', error);
        // 失敗不影響，已有本地數據顯示
      }
    }, 100); // 延遲100ms執行，讓UI先響應
  }
});

// 日期選擇事件
function handleDateChange() {
  const loc = document.getElementById('location').value;
  const dateSelect = document.getElementById('availableDates');
  const selectedDate = dateSelect.value;
  
  if (!loc || !selectedDate) {
    return;
  }
  
  // 檢查日曆上是否已有餐車名稱
  const hasEvent = allEvents.some(event => {
    let eventDate;
    if (event.start instanceof Date) {
      eventDate = event.start.toISOString().split('T')[0];
    } else {
      eventDate = event.start.split('T')[0];
    }
    return eventDate === selectedDate && event.location === loc;
  });
  
  if (hasEvent) {
    alert('該日期已有餐車排班，請選擇其他日期');
    return;
  }
}

// 綁定事件
document.getElementById('date').addEventListener('change', handleDateChange);
document.getElementById('availableDates').addEventListener('change', handleDateChange);

// 數據持久化功能（v2.3.0：已停用，完全依賴Google Sheets）
function saveToLocalStorage() {
  // v2.3.0：不再保存到localStorage，避免舊數據污染
  // 所有數據完全來自Google Sheets
  console.log('ℹ️ v2.3.0: 不使用本地存儲，數據完全來自 Google Sheets');
  return;
  
  // 以下代碼已停用
  // try {
  //   const data = {
  //     allEvents: allEvents,
  //     bookedSlots: bookedSlots,
  //     lastUpdate: formatTimestamp()
  //   };
  //   localStorage.setItem('foodtruck_bookings', JSON.stringify(data));
  //   console.log('數據已保存到本地存儲');
  // } catch (error) {
  //   console.error('保存到本地存儲失敗:', error);
  // }
}

// 清除本地緩存
function clearLocalCache() {
  localStorage.clear();
  allEvents.length = 0;
  Object.keys(bookedSlots).forEach(key => delete bookedSlots[key]);
  console.log('✅ 本地緩存已清除');
  showToast('success', '緩存已清除', '本地數據已清空，請重新整理頁面');
}

// 診斷所有預約數據
function diagnoseAllBookings() {
  console.log('========== 預約數據診斷 ==========');
  
  // 1. 檢查allEvents
  console.log('\n【allEvents】共', allEvents.length, '個事件:');
  allEvents.forEach((event, index) => {
    let eventDate;
    if (event.start instanceof Date) {
      eventDate = event.start.toISOString().split('T')[0];
    } else {
      eventDate = event.start.split('T')[0];
    }
    console.log(`  ${index + 1}. ${event.title} - ${event.location} - ${eventDate} (來源: ${event.source || '未知'})`);
  });
  
  // 2. 檢查bookedSlots
  console.log('\n【bookedSlots】:');
  Object.keys(bookedSlots).forEach(location => {
    console.log(`  場地: ${location}`);
    Object.keys(bookedSlots[location]).forEach(date => {
      console.log(`    - ${date}: ${bookedSlots[location][date].join(', ')}`);
    });
  });
  
  // 3. 檢查sheetsBookedDates
  console.log('\n【sheetsBookedDates】:');
  Object.keys(sheetsBookedDates).forEach(location => {
    console.log(`  場地: ${location}, 數量: ${sheetsBookedDates[location].length}`);
    sheetsBookedDates[location].forEach(booking => {
      console.log(`    - ${booking.standardDate}: ${booking.vendor || '無店名'}`);
    });
  });
  
  // 4. 檢查sheetsBookings
  console.log('\n【sheetsBookings】共', sheetsBookings.length, '筆:');
  sheetsBookings.forEach((booking, index) => {
    console.log(`  ${index + 1}. ${booking.vendor} - ${booking.location} - ${booking.date}`);
  });
  
  // 5. 檢查localStorage
  console.log('\n【localStorage】:');
  const localData = localStorage.getItem('foodtruck_bookings');
  if (localData) {
    const parsed = JSON.parse(localData);
    console.log('  lastUpdate:', parsed.lastUpdate);
    console.log('  allEvents數量:', parsed.allEvents?.length || 0);
    console.log('  bookedSlots場地數:', Object.keys(parsed.bookedSlots || {}).length);
  } else {
    console.log('  無本地存儲數據');
  }
  
  console.log('\n===================================');
  
  return {
    allEvents: allEvents.length,
    bookedSlots: Object.keys(bookedSlots).length,
    sheetsBookedDates: Object.keys(sheetsBookedDates).length,
    sheetsBookings: sheetsBookings.length
  };
}

// 快速測試同步
window.quickTest = async function() {
  console.log('========== 快速測試 ==========');
  
  // 1. 檢查配置
  console.log('Supabase URL:', SUPABASE_CONFIG.url);
  console.log('同步已啟用:', SUPABASE_CONFIG.enabled);
  
  // 2. 手動同步
  console.log('\n正在同步 Google Sheets...');
  try {
    await fetchBookingsFromGoogleSheets();
    console.log('同步後 sheetsBookings 數量:', sheetsBookings.length);
    
    await fetchBookedDatesFromSheets();
    let totalBooked = 0;
    Object.keys(sheetsBookedDates).forEach(loc => {
      totalBooked += sheetsBookedDates[loc].length;
    });
    console.log('同步後已預約日期數量:', totalBooked);
    
    // 3. 合併到日曆
    mergeSheetsDataToCalendar();
    console.log('合併後 allEvents 數量:', allEvents.length);
    
    // 4. 重新渲染
    renderCalendar();
    
    console.log('\n✅ 測試完成！如果數量為0，表示 Google Sheets 可能是空的');
    console.log('請執行 diagnoseAllBookings() 查看詳細資料');
    
  } catch (error) {
    console.error('❌ 測試失敗:', error);
  }
  
  console.log('===========================');
};

// 檢查當前顯示的數據來源
function checkDataSource() {
  console.log('========================================');
  console.log('📊 當前數據來源檢查');
  console.log('========================================');
  console.log(`總事件數: ${allEvents.length}`);
  
  const sourceCounts = {};
  allEvents.forEach(event => {
    const source = event.source || '未知';
    sourceCounts[source] = (sourceCounts[source] || 0) + 1;
  });
  
  console.log('\n📍 數據來源統計:');
  Object.keys(sourceCounts).forEach(source => {
    console.log(`   ${source}: ${sourceCounts[source]} 個事件`);
  });
  
  console.log('\n📋 詳細列表:');
  allEvents.forEach((event, index) => {
    let dateStr;
    if (event.start instanceof Date) {
      dateStr = event.start.toISOString().split('T')[0];
    } else {
      dateStr = event.start.split('T')[0];
    }
    const originalLoc = event.originalLocation ? ` (原: ${event.originalLocation})` : '';
    console.log(`   ${index + 1}. ${event.title} | ${event.location}${originalLoc} | ${dateStr} | 來源: ${event.source || '未知'}`);
  });
  
  console.log('========================================');
  console.log('✅ 如果所有來源都是 "google_sheets"，表示數據正確');
  console.log('❌ 如果有其他來源，請執行 clearLocalCache() 清除舊數據');
  console.log('========================================');
}

// 檢查 Google Sheets 中的場地名稱格式
function checkSheetsLocationNames() {
  console.log('========================================');
  console.log('🔍 檢查 Google Sheets 場地名稱格式');
  console.log('========================================');
  
  if (!sheetsBookings || sheetsBookings.length === 0) {
    console.warn('❌ 沒有 Google Sheets 數據');
    console.log('請先執行: await fetchBookingsFromGoogleSheets()');
    return;
  }
  
  console.log(`📊 共 ${sheetsBookings.length} 筆資料\n`);
  
  // 統計場地名稱
  const locationStats = {};
  const unknownLocations = [];
  
  sheetsBookings.forEach((booking, index) => {
    const original = booking.location;
    const normalized = normalizeLocationName(booking.location);
    const isValid = locationConfigs[normalized] !== undefined;
    
    if (!locationStats[original]) {
      locationStats[original] = {
        count: 0,
        normalized: normalized,
        isValid: isValid
      };
    }
    locationStats[original].count++;
    
    if (!isValid) {
      unknownLocations.push({
        index: index + 1,
        vendor: booking.vendor,
        location: original,
        date: booking.date
      });
    }
  });
  
  console.log('📍 場地名稱統計:\n');
  Object.keys(locationStats).forEach(location => {
    const stat = locationStats[location];
    const status = stat.isValid ? '✅' : '❌';
    const normalized = location !== stat.normalized ? ` → ${stat.normalized}` : '';
    console.log(`${status} "${location}"${normalized}: ${stat.count} 筆`);
  });
  
  if (unknownLocations.length > 0) {
    console.log('\n❌ 無法識別的場地名稱:');
    unknownLocations.forEach(item => {
      console.log(`   第 ${item.index} 筆: ${item.vendor} | "${item.location}" | ${item.date}`);
    });
    console.log('\n💡 建議修正 Google Sheets 中的場地名稱為以下格式之一:');
    console.log('   • 四維路59號');
    console.log('   • 四維路60號');
    console.log('   • 漢堡大亨 或 四維路70號');
    console.log('   • 自由風 或 四維路190號');
    console.log('   • 蔬蒔 或 四維路216號');
    console.log('   • 金正好吃 或 四維路218號');
  }
  
  console.log('========================================');
}

// 暴露到全局供控制台使用
window.clearLocalCache = clearLocalCache;
window.diagnoseAllBookings = diagnoseAllBookings;
window.checkDataSource = checkDataSource;
window.syncOnlySheetsData = syncOnlySheetsData;
window.checkSheetsLocationNames = checkSheetsLocationNames;
window.normalizeLocationName = normalizeLocationName;

function loadFromLocalStorage() {
  // v3.2.3：載入快取數據
  try {
    const data = localStorage.getItem('foodtruck_cache');
    if (!data) {
      console.log('無本地快取');
      return false;
    }
    
    const parsed = JSON.parse(data);
    
    // 檢查快取版本
    if (parsed.version !== SYSTEM_VERSION) {
      console.log('快取版本不符，清除舊快取');
      localStorage.removeItem('foodtruck_cache');
      return false;
    }
    
    // 檢查快取時間（超過1小時視為過期）
    const cacheTime = new Date(parsed.lastUpdate);
    const now = new Date();
    const hoursSinceCache = (now - cacheTime) / (1000 * 60 * 60);
    
    if (hoursSinceCache > 1) {
      console.log(`快取已過期 (${hoursSinceCache.toFixed(1)} 小時)，將重新載入`);
      return false;
    }
    
    // 載入快取的 Google Sheets 數據
    if (parsed.sheetsBookings && Array.isArray(parsed.sheetsBookings)) {
      sheetsBookings = parsed.sheetsBookings;
      console.log(`✅ 從快取載入 ${sheetsBookings.length} 筆預約記錄`);
    }
    
    if (parsed.sheetsBookedDates) {
      sheetsBookedDates = parsed.sheetsBookedDates;
      let totalBooked = 0;
      Object.keys(sheetsBookedDates).forEach(loc => {
        totalBooked += sheetsBookedDates[loc].length;
      });
      console.log(`✅ 從快取載入 ${totalBooked} 個已預約日期`);
    }
    
    console.log(`✅ 快取載入成功 (${Math.round(hoursSinceCache * 60)} 分鐘前)`);
    return true;
  } catch (error) {
    console.error('從本地存儲載入數據失敗:', error);
    localStorage.removeItem('foodtruck_cache');
    return false;
  }
}

// 智能合併數據（基於時間戳的先後順序）
function mergeDataByTimestamp(githubBookings) {
  const mergedEvents = [];
  const mergedBookedSlots = {};
  const processedKeys = new Set(); // 記錄已處理的預約鍵值
  
  // 按時間戳排序（舊的在前，新的在後）
  const sortedBookings = githubBookings.sort((a, b) => {
    const timeA = new Date(a.timestamp || a.cancelledAt || '1970-01-01');
    const timeB = new Date(b.timestamp || b.cancelledAt || '1970-01-01');
    return timeA - timeB;
  });
  
  // 只在開發模式下輸出詳細日誌
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    console.log('按時間戳排序的預約數據:', sortedBookings);
  }
  
  sortedBookings.forEach(booking => {
    const bookingKey = `${booking.location}-${booking.date}-${booking.timeSlot || '14:00-20:00'}`;
    
    // 如果是取消記錄
    if (booking.action === 'cancelled') {
      // 從已處理的記錄中移除
      processedKeys.delete(bookingKey);
      
      // 從合併數據中移除
      const eventIndex = mergedEvents.findIndex(e => 
        e.title === booking.vendor && 
        e.location === booking.location && 
        e.start === booking.date
      );
      if (eventIndex !== -1) {
        mergedEvents.splice(eventIndex, 1);
        // 只在開發模式下輸出詳細日誌
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log(`移除取消的預約: ${booking.vendor} - ${booking.location} - ${booking.date}`);
        }
      }
      
      // 從已預約時段中移除
      if (mergedBookedSlots[booking.location] && mergedBookedSlots[booking.location][booking.date]) {
        const slotIndex = mergedBookedSlots[booking.location][booking.date].indexOf(booking.timeSlot || '14:00-20:00');
        if (slotIndex !== -1) {
          mergedBookedSlots[booking.location][booking.date].splice(slotIndex, 1);
          
          // 如果該日期沒有其他時段，刪除整個日期
          if (mergedBookedSlots[booking.location][booking.date].length === 0) {
            delete mergedBookedSlots[booking.location][booking.date];
          }
        }
      }
    } else {
      // 如果是預約記錄
      // 檢查是否已經處理過（後來的會覆蓋前面的）
      if (processedKeys.has(bookingKey)) {
        // 只在開發模式下輸出詳細日誌
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          console.log(`跳過重複預約: ${booking.vendor} - ${booking.location} - ${booking.date} (已有更新的記錄)`);
        }
        return;
      }
      
      // 檢查是否與現有事件衝突
      const existingEvent = mergedEvents.find(e => 
        e.location === booking.location && 
        e.start === booking.date
      );
      
      if (existingEvent) {
        // 比較時間戳，保留較新的
        const existingTime = new Date(existingEvent.timestamp || '1970-01-01');
        const newTime = new Date(booking.timestamp || '1970-01-01');
        
        if (newTime > existingTime) {
          // 移除舊的，添加新的
          const oldIndex = mergedEvents.indexOf(existingEvent);
          mergedEvents.splice(oldIndex, 1);
          // 只在開發模式下輸出詳細日誌
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`替換預約: ${existingEvent.title} → ${booking.vendor} (${booking.location} - ${booking.date})`);
          }
        } else {
          // 只在開發模式下輸出詳細日誌
          if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log(`保留現有預約: ${existingEvent.title} (${booking.location} - ${booking.date})`);
          }
          return;
        }
      }
      
      // 添加新事件
      const event = {
        title: booking.vendor,
        start: booking.date,
        location: booking.location,
        color: '#28a745',
        source: 'github',
        timestamp: booking.timestamp
      };
      mergedEvents.push(event);
      
      // 更新已預約時段
      if (!mergedBookedSlots[booking.location]) {
        mergedBookedSlots[booking.location] = {};
      }
      if (!mergedBookedSlots[booking.location][booking.date]) {
        mergedBookedSlots[booking.location][booking.date] = [];
      }
      if (!mergedBookedSlots[booking.location][booking.date].includes(booking.timeSlot || '14:00-20:00')) {
        mergedBookedSlots[booking.location][booking.date].push(booking.timeSlot || '14:00-20:00');
      }
      
      processedKeys.add(bookingKey);
      // 只在開發模式下輸出詳細日誌
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log(`添加預約: ${booking.vendor} - ${booking.location} - ${booking.date}`);
      }
    }
  });
  
  return { mergedEvents, mergedBookedSlots };
}

// 即時數據同步
async function syncWithGitHub() {
  try {
    console.log('開始同步GitHub數據...');
    const githubBookings = await fetchBookingsFromGitHub();
    
    if (githubBookings.length > 0) {
      // 使用智能合併處理數據
      const { mergedEvents, mergedBookedSlots } = mergeDataByTimestamp(githubBookings);
      
      // 更新本地數據（從GitHub JSON同步）
      allEvents.length = 0;
      allEvents.push(...mergedEvents);
      Object.assign(bookedSlots, mergedBookedSlots);
      
      // 保存到本地存儲
      saveToLocalStorage();
      
      // 重新渲染行事曆（顯示從JSON同步的數據）
      renderCalendar();
      
      console.log('日曆已更新，顯示從GitHub JSON同步的預約數據');
      
      console.log('GitHub數據同步完成，共處理', githubBookings.length, '筆記錄');
      showSyncStatus('同步完成', 'success');
    } else {
      showSyncStatus('數據已是最新', 'success');
    }
  } catch (error) {
    console.error('同步GitHub數據失敗:', error);
    showSyncStatus('同步失敗', 'error');
  }
}

// 同步狀態控制 - 已隱藏（用戶要求）
function showSyncStatus(message, type = 'default') {
  // 不顯示同步狀態，用戶要求隱藏右下角數據
  return;
  
  const status = document.getElementById('syncStatus');
  const icon = status.querySelector('i');
  const text = status.querySelector('span');
  
  status.className = `sync-status show ${type}`;
  text.textContent = message;
  
  if (type === 'default') {
    icon.className = 'fas fa-sync-alt';
  } else if (type === 'success') {
    icon.className = 'fas fa-check';
  } else if (type === 'error') {
    icon.className = 'fas fa-exclamation-triangle';
  }
  
  // 添加點擊手動同步功能
  status.onclick = function() {
    if (window.manualSync) {
      window.manualSync();
    }
  };
  
  // 添加提示文字
  status.title = '點擊手動同步最新數據';
  
  // 5秒後自動隱藏（延長顯示時間）
  setTimeout(() => {
    status.classList.remove('show');
  }, 5000);
}

// 檢查預約衝突（完全依賴Google Sheets）
async function checkBookingConflict(location, date, timeSlot) {
  try {
    console.log(`檢查預約衝突: ${location} - ${date} - ${timeSlot}`);
    
    // 1. 檢查本地數據
    if (bookedSlots[location] && bookedSlots[location][date]) {
      if (bookedSlots[location][date].includes(timeSlot)) {
        console.log('本地數據發現衝突');
        return true;
      }
    }
    
    // 2. 檢查Google Sheets已預約日期（最準確的來源）
    if (sheetsBookedDates[location]) {
      const hasConflict = sheetsBookedDates[location].some(booking => 
        booking.standardDate === date
      );
      
      if (hasConflict) {
        console.log('Google Sheets數據發現衝突');
        return true;
      }
    }
    
    // 3. 檢查allEvents中的預約
    const hasEventConflict = allEvents.some(event => {
      let eventDate;
      if (event.start instanceof Date) {
        eventDate = `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`;
      } else {
        eventDate = event.start.split('T')[0];
      }
      return eventDate === date && event.location === location;
    });
    
    if (hasEventConflict) {
      console.log('日曆事件發現衝突');
      return true;
    }
    
    console.log('沒有發現衝突');
    return false;
  } catch (error) {
    console.error('檢查預約衝突失敗:', error);
    // 如果檢查失敗，返回false讓用戶可以繼續預約
    return false;
  }
}

// 即時數據同步系統（暫時禁用GitHub同步）
function startPeriodicSync() {
  console.log('GitHub定期同步已禁用，系統完全依賴 Supabase');
  
  // 暫時禁用所有GitHub同步，避免401錯誤
  // 系統主要依賴Google Sheets運作
  
  // let lastSyncTime = 0;
  // const SYNC_INTERVAL = 60000;
  // const MIN_SYNC_INTERVAL = 30000;
  // const FAST_SYNC_INTERVAL = 5000;
  
  // async function smartSync(force = false, fast = false) {
  //   const now = Date.now();
  //   const minInterval = fast ? FAST_SYNC_INTERVAL : MIN_SYNC_INTERVAL;
  //   
  //   if (!force && (now - lastSyncTime) < minInterval) {
  //     console.log('跳過GitHub同步：距離上次同步時間太短');
  //     return;
  //   }
  //   
  //   lastSyncTime = now;
  //   showSyncStatus('同步中...', 'default');
  //   await syncWithGitHub();
  // }
  
  // setInterval(() => {
  //   smartSync();
  // }, SYNC_INTERVAL);
  
  // document.addEventListener('visibilitychange', async () => {
  //   if (!document.hidden) {
  //     await smartSync(true, true);
  //   }
  // });
  
  // 禁用用戶點擊觸發同步（避免過於頻繁）
  // let syncTimeout;
  // document.addEventListener('click', () => {
  //   clearTimeout(syncTimeout);
  //   syncTimeout = setTimeout(() => {
  //     smartSync(false, true); // 快速同步
  //   }, 1000); // 1秒後快速同步
  // });
  
  // 禁用表單提交觸發同步（已在提交成功後手動觸發）
  // document.addEventListener('submit', () => {
  //   setTimeout(() => {
  //     smartSync(true, true); // 強制快速同步
  //   }, 500);
  // });
  
  // GitHub同步已禁用
  // let lastFocusSync = 0;
  // window.addEventListener('focus', () => {
  //   const now = Date.now();
  //   if (now - lastFocusSync > 60000) {
  //     lastFocusSync = now;
  //     smartSync(true, true);
  //   }
  // });
  
  // window.addEventListener('online', () => {
  //   smartSync(true, true);
  // });
  
  // 添加手動同步功能
  window.manualSync = async function() {
    showSyncStatus('手動同步中...', 'default');
    await smartSync(true);
  };
  
  // 添加測試同步功能
  window.testSync = async function() {
    console.log('開始測試同步...');
    showSyncStatus('測試同步中...', 'default');
    
    try {
      await syncWithGitHub();
      console.log('測試同步完成');
    } catch (error) {
      console.error('測試同步失敗:', error);
      showSyncStatus('測試同步失敗', 'error');
    }
  };
  
  // 添加GitHub診斷功能
  window.diagnoseGitHub = async function() {
    console.log('開始診斷GitHub連接...');
    
    try {
      // 測試1: 檢查Token
      console.log('測試1: 檢查Token權限...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Token有效，用戶:', userData.login);
      } else {
        console.error('❌ Token無效:', userResponse.status, await userResponse.text());
        return;
      }
      
      // 測試2: 檢查倉庫
      console.log('測試2: 檢查倉庫權限...');
      const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        console.log('✅ 倉庫可訪問:', repoData.full_name);
      } else {
        console.error('❌ 倉庫無法訪問:', repoResponse.status, await repoResponse.text());
        return;
      }
      
      // 測試3: 檢查bookings目錄
      console.log('測試3: 檢查bookings目錄...');
      const bookingsResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/bookings`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (bookingsResponse.ok) {
        const bookingsData = await bookingsResponse.json();
        console.log('✅ bookings目錄可訪問，文件數量:', bookingsData.length);
      } else {
        console.error('❌ bookings目錄無法訪問:', bookingsResponse.status, await bookingsResponse.text());
      }
      
      // 測試4: 嘗試上傳測試文件
      console.log('測試4: 嘗試上傳測試文件...');
      const testData = {
        vendor: '診斷測試',
        location: '四維路59號',
        date: new Date().toISOString().split('T')[0],
        timeSlot: '14:00-20:00',
        fee: '600',
        timestamp: formatTimestamp(),
        uploadTime: Date.now()
      };
      
      const result = await uploadToGitHub(testData);
      console.log('✅ 測試上傳成功:', result);
      
    } catch (error) {
      console.error('❌ 診斷失敗:', error);
    }
  };
  
  // 添加測試index.html更新功能
  window.testIndexUpdate = async function() {
    console.log('開始測試index.html更新功能...');
    
    try {
      const testData = {
        vendor: '測試更新',
        location: '四維路60號',
        date: formatTimestamp().split('T')[0],
        timeSlot: '14:00-20:00',
        foodType: '測試類型',
        fee: '600',
        timestamp: formatTimestamp(),
        uploadTime: Date.now()
      };
      
      const result = await updateIndexHtmlOnGitHub(testData);
      console.log('✅ index.html更新測試成功:', result);
      showToast('success', '測試成功', 'index.html更新功能正常');
      
    } catch (error) {
      console.error('❌ index.html更新測試失敗:', error);
      showToast('error', '測試失敗', 'index.html更新功能異常: ' + error.message);
    }
  };
  
  // 添加測試統計計算功能
  window.testStatsCalculation = async function() {
    console.log('開始測試統計計算功能...');
    
    try {
      const stats = await calculateAccurateStats();
      console.log('✅ 統計計算測試成功:', stats);
      showToast('success', '統計計算成功', `總預約: ${stats.totalBookings}, 今日: ${stats.todayBookings}, 活躍場地: ${stats.activeLocations}`);
      
    } catch (error) {
      console.error('❌ 統計計算測試失敗:', error);
      showToast('error', '統計計算失敗', '統計計算功能異常: ' + error.message);
    }
  };
  
  // 添加測試即時數據文件更新功能
  window.testRealtimeDataUpdate = async function() {
    console.log('開始測試即時數據文件更新功能...');
    
    try {
      const result = await updateRealtimeDataFile();
      console.log('✅ 即時數據文件更新測試成功:', result);
      showToast('success', '即時數據更新成功', '即時數據文件已更新到GitHub');
      
    } catch (error) {
      console.error('❌ 即時數據文件更新測試失敗:', error);
      showToast('error', '即時數據更新失敗', '即時數據文件更新異常: ' + error.message);
    }
  };
  
  // 添加Token更新功能
  window.updateGitHubToken = function(newToken) {
    if (!newToken || !newToken.startsWith('ghp_')) {
      console.error('❌ 無效的Token格式，Token應該以ghp_開頭');
      showToast('error', 'Token格式錯誤', 'Token應該以ghp_開頭');
      return false;
    }
    
    GITHUB_CONFIG.token = newToken;
    console.log('✅ GitHub Token已更新');
    showToast('success', 'Token已更新', 'GitHub Token已成功更新');
    
    // 立即測試新Token
    setTimeout(() => {
      diagnoseGitHub();
    }, 1000);
    
    return true;
  };
  
  
  // 添加日曆數據同步測試
  window.testCalendarSync = async function() {
    console.log('🧪 開始測試日曆數據同步...');
    
    try {
      // 1. 檢查當前日曆數據
      console.log('當前日曆事件數量:', allEvents.length);
      console.log('當前預約時段:', Object.keys(bookedSlots).length);
      
      // 2. 從GitHub同步數據
      console.log('從GitHub同步數據...');
      await syncWithGitHub();
      
      // 3. 檢查同步後的數據
      console.log('同步後日曆事件數量:', allEvents.length);
      console.log('同步後預約時段:', Object.keys(bookedSlots).length);
      
      // 4. 檢查日曆是否正確渲染
      const calendarGrid = document.getElementById('calendarGrid');
      const eventElements = calendarGrid.querySelectorAll('.event-item');
      console.log('日曆中顯示的事件數量:', eventElements.length);
      
      showToast('success', '日曆同步測試完成', `日曆事件: ${allEvents.length}, 顯示事件: ${eventElements.length}`);
      
    } catch (error) {
      console.error('❌ 日曆同步測試失敗:', error);
      showToast('error', '日曆同步測試失敗', error.message);
    }
  };
  
  // 添加詳細的GitHub錯誤診斷
  window.diagnoseGitHubDetailed = async function() {
    console.log('🔍 開始詳細診斷GitHub問題...');
    
    try {
      // 測試1: 基本連接
      console.log('測試1: 基本API連接...');
      const basicResponse = await fetch('https://api.github.com/zen');
      if (basicResponse.ok) {
        const zen = await basicResponse.text();
        console.log('✅ GitHub API可訪問:', zen);
      } else {
        console.error('❌ GitHub API無法訪問:', basicResponse.status);
        return;
      }
      
      // 測試2: Token驗證
      console.log('測試2: Token驗證...');
      const userResponse = await fetch('https://api.github.com/user', {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        console.log('✅ Token有效，用戶:', userData.login);
        console.log('用戶信息:', userData);
      } else {
        const errorText = await userResponse.text();
        console.error('❌ Token無效:', userResponse.status, errorText);
        return;
      }
      
      // 測試3: 倉庫訪問
      console.log('測試3: 倉庫訪問...');
      const repoResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (repoResponse.ok) {
        const repoData = await repoResponse.json();
        console.log('✅ 倉庫可訪問:', repoData.full_name);
        console.log('倉庫信息:', {
          name: repoData.name,
          full_name: repoData.full_name,
          private: repoData.private,
          permissions: repoData.permissions
        });
      } else {
        const errorText = await repoResponse.text();
        console.error('❌ 倉庫無法訪問:', repoResponse.status, errorText);
        return;
      }
      
      // 測試4: 創建測試文件
      console.log('測試4: 創建測試文件...');
      const testContent = JSON.stringify({
        test: true,
        timestamp: formatTimestamp(),
        message: 'GitHub連接測試'
      }, null, 2);
      
      const testResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/test-connection.json`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github+json'
        },
        body: JSON.stringify({
          message: '測試GitHub連接',
          content: safeBase64Encode(testContent),
          branch: GITHUB_CONFIG.branch
        })
      });
      
      if (testResponse.ok) {
        const testResult = await testResponse.json();
        console.log('✅ 測試文件創建成功:', testResult.content.html_url);
        
        // 刪除測試文件
        setTimeout(async () => {
          try {
            const deleteResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/test-connection.json`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github+json'
              },
              body: JSON.stringify({
                message: '刪除測試文件',
                sha: testResult.content.sha,
                branch: GITHUB_CONFIG.branch
              })
            });
            
            if (deleteResponse.ok) {
              console.log('✅ 測試文件已刪除');
            } else {
              console.log('⚠️ 測試文件刪除失敗，但這不影響功能');
            }
          } catch (error) {
            console.log('⚠️ 測試文件刪除失敗，但這不影響功能');
          }
        }, 2000);
        
      } else {
        const errorText = await testResponse.text();
        console.error('❌ 測試文件創建失敗:', testResponse.status, errorText);
      }
      
      console.log('🎉 GitHub詳細診斷完成！');
      
    } catch (error) {
      console.error('❌ 診斷過程中發生錯誤:', error);
    }
  };
  
  // 即時數據監聽器（已禁用，避免無限循環）
  // let lastDataHash = '';
  // async function checkForDataChanges() {
  //   try {
  //     // 獲取當前數據的哈希值（使用簡單的字符串長度和內容檢查）
  //     const currentData = JSON.stringify({ allEvents, bookedSlots });
  //     const currentHash = currentData.length + '_' + currentData.slice(0, 50); // 簡單哈希
  //     
  //     if (currentHash !== lastDataHash) {
  //       lastDataHash = currentHash;
  //       // 數據有變化，觸發快速同步
  //       await smartSync(false, true);
  //     }
  //   } catch (error) {
  //     console.error('數據變化檢測失敗:', error);
  //   }
  // }
  // 
  // // 每2秒檢查一次數據變化
  // setInterval(checkForDataChanges, 2000);
  
  // 監聽其他頁籤的數據變化（使用localStorage事件）
  window.addEventListener('storage', (e) => {
    if (e.key === 'foodtruck_bookings' || e.key === 'foodtruck_bookedSlots') {
      // 其他頁籤更新了數據，立即同步
      setTimeout(() => {
        smartSync(true, true);
      }, 100);
    }
  });
  
  // 添加GitHub連接測試功能
  window.testGitHubConnection = async function() {
    try {
      console.log('測試GitHub連接...');
      showSyncStatus('測試GitHub連接...', 'default');
      
      // 測試獲取倉庫信息
      const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}`, {
        headers: {
          'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
          'Accept': 'application/vnd.github+json'
        }
      });
      
      if (response.ok) {
        const repo = await response.json();
        console.log('GitHub倉庫信息:', repo);
        showSyncStatus('GitHub連接正常', 'success');
        
        // 測試獲取bookings目錄
        const bookingsResponse = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/bookings`, {
          headers: {
            'Authorization': `Bearer ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github+json'
          }
        });
        
        if (bookingsResponse.ok) {
          const files = await bookingsResponse.json();
          console.log('bookings目錄文件:', files);
          showSyncStatus(`GitHub連接正常，找到${files.length}個文件`, 'success');
        } else {
          console.error('無法訪問bookings目錄:', bookingsResponse.status);
          showSyncStatus('GitHub連接正常，但無法訪問bookings目錄', 'error');
        }
      } else {
        const error = await response.text();
        console.error('GitHub連接失敗:', response.status, error);
        showSyncStatus('GitHub連接失敗', 'error');
      }
    } catch (error) {
      console.error('GitHub連接測試錯誤:', error);
      showSyncStatus('GitHub連接測試失敗', 'error');
    }
  };
  
  // 添加手動創建目錄功能
  window.createGitHubDirectories = async function() {
    try {
      console.log('開始創建GitHub目錄...');
      showSyncStatus('創建GitHub目錄...', 'default');
      
      const bookingsResult = await createGitHubDirectory('bookings');
      const cancellationsResult = await createGitHubDirectory('cancellations');
      
      if (bookingsResult && cancellationsResult) {
        showSyncStatus('成功創建所有目錄', 'success');
        console.log('所有目錄創建成功');
      } else {
        showSyncStatus('部分目錄創建失敗', 'error');
        console.log('目錄創建結果:', { bookingsResult, cancellationsResult });
      }
    } catch (error) {
      console.error('創建目錄錯誤:', error);
      showSyncStatus('創建目錄失敗', 'error');
    }
  };
}

// 所有場地的預約事件 - 根據Google Sheets 10月份實際排班資料更新
// 所有事件 - 現在完全從 Google Sheets 動態載入
let allEvents = [];

// 新行事曆系統
let currentDate = new Date(); // 當前日期
let currentFilter = '四維路59號';

// 初始化新行事曆
function initNewCalendar() {
  renderCalendar();
  setupCalendarEvents();
}

// 渲染行事曆
function renderCalendar() {
  const calendarGrid = document.getElementById('calendarGrid');
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  // 更新月份顯示
  document.getElementById('currentMonth').textContent = `${year}年${month + 1}月`;
  
  // 清空網格
  calendarGrid.innerHTML = '';
  
  // 添加星期標題
  const dayHeaders = ['日', '一', '二', '三', '四', '五', '六'];
  dayHeaders.forEach(day => {
    const header = document.createElement('div');
    header.className = 'calendar-day-header';
    header.textContent = day;
    calendarGrid.appendChild(header);
  });
  
  // 獲取月份的第一天和最後一天
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay());
  
  // 生成42個日期格子（6週）
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-day';
    
    // 檢查是否為其他月份
    if (date.getMonth() !== month) {
      dayElement.classList.add('other-month');
    }
    
    // 檢查是否為今天
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      dayElement.classList.add('today');
    }
    
    // 檢查是否為過去日期
    const todayForComparison = new Date();
    todayForComparison.setHours(0, 0, 0, 0);
    const dateForComparison = new Date(date);
    dateForComparison.setHours(0, 0, 0, 0);
    
    if (dateForComparison < todayForComparison) {
      dayElement.classList.add('past-date');
    }
    
    // 添加日期數字
    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = date.getDate();
    dayElement.appendChild(dayNumber);
    
    // 添加事件
    const eventsContainer = document.createElement('div');
    eventsContainer.className = 'day-events';
    
    // 修正時區問題：使用本地日期格式
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const dayEvents = allEvents.filter(event => {
      const eventDate = event.start instanceof Date ? 
        `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}` : 
        event.start.split('T')[0];
      return eventDate === dateStr;
    });
    
    let paymentStatusElement = null; // 保存付款狀態元素
    
    dayEvents.forEach(event => {
      // 只顯示當前篩選場地的事件
      if (event.location === currentFilter) {
        const eventContainer = document.createElement('div');
        eventContainer.className = 'event-container';
        
        const eventElement = document.createElement('div');
        eventElement.className = 'event-item';
        eventElement.textContent = event.title;
        eventElement.title = `${event.title} - ${event.location}`;
        eventElement.addEventListener('click', () => {
          // 如果是己付款的預約，顯示釋出選項
          if (event.payment === '已付款' || event.payment === '己繳款') {
            showTransferModal(event, dateStr);
          } else {
            showToast('info', '餐車資訊', `${event.title}\n場地：${event.location}\n時間：14:00-20:00`);
          }
        });
        
        eventContainer.appendChild(eventElement);
        
        // 添加付款狀態和倒計時
        let isOverdue = false;
        let needsPayment = false;
        
        if (event.payment || event.timestamp || event.bookedStatus) {
          const paymentStatus = document.createElement('div');
          paymentStatus.className = 'payment-status';
          
          // 日誌：診斷付款狀態
          console.log(`📊 付款狀態檢查 - 餐車: ${event.title}, payment: "${event.payment}", bookedStatus: "${event.bookedStatus}"`);
          
          // 檢查付款狀態（包含「已付款」和「己繳款」）
          if (event.payment === '已付款' || event.payment === '己繳款') {
            console.log('  ✅ 已付款 - 顯示可釋出');
            paymentStatus.innerHTML = '<span class="paid">✓ 已付款</span>';
            paymentStatus.classList.add('paid-status');
            // 已付款的預約可以點擊釋出
            paymentStatus.style.cursor = 'pointer';
            paymentStatus.title = '點擊釋出排班';
            paymentStatus.addEventListener('click', (e) => {
              e.stopPropagation();
              showTransferModal(event, dateStr);
            });
          } 
          // 檢查是否為逾繳可排狀態（來自Google Sheets）
          else if (event.bookedStatus === '逾繳可排') {
            isOverdue = true;
            paymentStatus.innerHTML = '<span class="unpaid overdue">❌ 逾繳可排</span>';
            paymentStatus.classList.add('overdue-status');
            // 點擊文字打開接手彈窗
            paymentStatus.addEventListener('click', (e) => {
              e.stopPropagation();
              showTakeoverModal(event, dateStr);
            });
            paymentStatus.title = '點擊接手此預約';
          } 
          // 一般未付款狀態
          else {
            console.log('  ⏰ 未付款 - 顯示倒計時');
            // 計算24小時倒計時
            console.log('計算倒計時 - 時間戳記:', event.timestamp);
            const bookingTime = new Date(event.timestamp);
            console.log('計算倒計時 - 預約時間:', bookingTime.toISOString());
            const deadline = new Date(bookingTime.getTime() + 24 * 60 * 60 * 1000); // 24小時後
            console.log('計算倒計時 - 截止時間:', deadline.toISOString());
            const now = new Date();
            const timeLeft = deadline - now;
            console.log('計算倒計時 - 剩餘毫秒:', timeLeft);
            
            if (timeLeft > 0) {
              needsPayment = true;
              const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
              const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
              
              if (hoursLeft < 6) {
                // 少於6小時，橙紅警告
                paymentStatus.innerHTML = `<span class="unpaid urgent">⚠️ ${hoursLeft}h${minutesLeft}m繳費時間</span>`;
              } else {
                // 還有時間，黃色提醒
                paymentStatus.innerHTML = `<span class="unpaid">⏰ ${hoursLeft}h繳費時間</span>`;
              }
              paymentStatus.classList.add('unpaid-status');
              // 點擊文字打開繳費彈窗
              paymentStatus.addEventListener('click', (e) => {
                e.stopPropagation();
                showPaymentModal();
              });
              paymentStatus.title = '點擊前往繳費';
            } else {
              // 已逾期（超過24小時）
              isOverdue = true;
              paymentStatus.innerHTML = '<span class="unpaid overdue">❌ 逾繳可排</span>';
              paymentStatus.classList.add('overdue-status');
              // 點擊文字打開接手彈窗
              paymentStatus.addEventListener('click', (e) => {
                e.stopPropagation();
                showTakeoverModal(event, dateStr);
              });
              paymentStatus.title = '點擊接手此預約';
            }
          }
          
          // 保存付款狀態元素，稍後append到dayElement
          paymentStatusElement = paymentStatus;
        }
        
        // 添加取消按鈕和審計按鈕（只對當天和未來日期顯示）
        const today = new Date();
        today.setHours(0, 0, 0, 0); // 重置時間到當天開始
        
        const eventDate = new Date(dateStr);
        eventDate.setHours(0, 0, 0, 0); // 重置時間到當天開始
        
        const isTodayOrFuture = eventDate >= today;
        
        if (isTodayOrFuture) {
          // 管理按鈕（顯示在右上角，點擊後顯示管理選項）
          const cancelBtn = document.createElement('button');
          cancelBtn.className = 'cancel-btn';
          cancelBtn.innerHTML = '<i class="fas fa-cog"></i>';
          cancelBtn.title = '系統管理';
          cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showAdminOptionsModal(event, dateStr);
          });
          eventContainer.appendChild(cancelBtn);
        }
        
        eventsContainer.appendChild(eventContainer);
      }
    });
    
    // 檢查是否已預約
    if (dayEvents.length > 0) {
      const hasEventForLocation = dayEvents.some(event => event.location === currentFilter);
      if (hasEventForLocation) {
        dayElement.classList.add('booked');
      }
    }
    
    // 檢查各場地的非開放日期
    if (date.getMonth() === month) {
      const dayOfWeek = date.getDay(); // 0=週日, 1=週一, 2=週二, 3=週三, 4=週四, 5=週五, 6=週六
      let isNonOperating = false;
      
      switch (currentFilter) {
        case '四維路60號':
          // 週四~週日不開放
          if (dayOfWeek >= 4 || dayOfWeek === 0) {
            isNonOperating = true;
          }
          // 只有在營業日（週一~週三）才檢查並標記國定假日
          else if (nationalHolidays2025.includes(dateStr)) {
            const holidayBadge = document.createElement('div');
            holidayBadge.className = 'holiday-badge';
            holidayBadge.innerHTML = '❌ 國定假日';
            holidayBadge.title = getHolidayName(dateStr);
            dayElement.appendChild(holidayBadge);
            dayElement.classList.add('holiday-date');
          }
          break;
        case '蔬蒔':
          // 只有週三、週六可排
          if (dayOfWeek !== 3 && dayOfWeek !== 6) {
            isNonOperating = true;
          }
          break;
        case '金正好吃':
          // 只有週二可排
          if (dayOfWeek !== 2) {
            isNonOperating = true;
          }
          break;
        case '自由風':
          // 週六不排，其它都可排（日、一、二、三、四、五）
          if (dayOfWeek === 6) {
            isNonOperating = true;
          }
          break;
        case '漢堡大亨': // 四維路70號
          // 週日不排，其它都可排
          if (dayOfWeek === 0) {
            isNonOperating = true;
          }
          break;
      }
      
      if (isNonOperating) {
        dayElement.classList.add('non-operating');
      }
    }
    
    dayElement.appendChild(eventsContainer);
    
    // 如果有付款狀態，直接append到dayElement（這樣它就能移到最上方）
    if (paymentStatusElement) {
      dayElement.appendChild(paymentStatusElement);
    }
    
    // 為空白且可預約的日期添加點擊預約功能
    const isEmptyDay = dayEvents.length === 0 || !dayEvents.some(e => e.location === currentFilter);
    const isCurrentMonth = date.getMonth() === month;
    const isFuture = dateForComparison >= todayForComparison;
    const isOperating = !dayElement.classList.contains('non-operating');
    
    if (isEmptyDay && isCurrentMonth && isFuture && isOperating) {
      dayElement.style.cursor = 'pointer';
      dayElement.title = '點擊快速預約';
      
      // 添加hover效果
      dayElement.addEventListener('mouseenter', () => {
        if (!dayElement.classList.contains('booked') && !dayElement.classList.contains('non-operating')) {
          dayElement.style.backgroundColor = '#fff5f0';
        }
      });
      
      dayElement.addEventListener('mouseleave', () => {
        if (!dayElement.classList.contains('booked') && !dayElement.classList.contains('non-operating')) {
          dayElement.style.backgroundColor = '';
        }
      });
      
      // 點擊事件 - 快速預約
      dayElement.addEventListener('click', (e) => {
        // 檢查是否點擊的是按鈕或事件
        if (e.target.closest('.cancel-btn') || 
            e.target.closest('.takeover-btn') || 
            e.target.closest('.calendar-payment-btn') ||
            e.target.closest('.event-item') ||
            e.target.closest('.payment-status')) {
          return; // 不處理按鈕和事件的點擊
        }
        
        // 快速預約功能
        quickBooking(dateStr, currentFilter);
      });
    }
    
    calendarGrid.appendChild(dayElement);
  }
}

// 快速預約功能
function quickBooking(dateStr, location) {
  console.log('快速預約:', dateStr, location);
  
  // 自動填入場地
  const locationSelect = document.getElementById('location');
  locationSelect.value = location;
  locationSelect.dispatchEvent(new Event('change'));
  
  // 等待場地選擇器更新後，再設定日期
  setTimeout(() => {
    const dateSelect = document.getElementById('availableDates');
    
    // 檢查日期是否在選項中
    const dateOption = Array.from(dateSelect.options).find(opt => opt.value === dateStr);
    
    if (dateOption) {
      dateSelect.value = dateStr;
      
      // 滾動到表單
      const formElement = document.getElementById('form');
      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      
      // 高亮表單並提示
      formElement.style.transition = 'all 0.3s ease';
      formElement.style.boxShadow = '0 0 0 3px rgba(255, 139, 0, 0.3)';
      
      setTimeout(() => {
        formElement.style.boxShadow = '';
      }, 2000);
      
      showToast('success', '已選擇檔期', `📍 ${location}\n📅 ${dateStr}\n👉 請填寫餐車資訊後送出`);
      
      // 聚焦到餐車名稱輸入框
      setTimeout(() => {
        document.getElementById('vendorName').focus();
      }, 500);
    } else {
      showToast('warning', '日期不可用', '該日期可能已被預約或不在可選範圍內，請重新選擇');
    }
  }, 300);
}

// 設定行事曆事件
function setupCalendarEvents() {
  // 月份導航（使用新 Date 避免 setMonth 溢位：例如 1/31 點下一月會變成 3 月）
  document.getElementById('prevMonth').addEventListener('click', () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    currentDate = new Date(y, m - 1, 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();
    currentDate = new Date(y, m + 1, 1);
    renderCalendar();
  });
  
  document.getElementById('todayBtn').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar();
  });
  
  // 場地篩選按鈕
  document.querySelectorAll('.location-filter .filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // 移除所有按鈕的active類別
      document.querySelectorAll('.location-filter .filter-btn').forEach(b => b.classList.remove('active'));
      // 為當前按鈕添加active類別
      btn.classList.add('active');
      // 更新篩選條件
      currentFilter = btn.dataset.location;
      
      // 同步更新報名表的場地選擇
      const formLocationSelect = document.getElementById('location');
      if (formLocationSelect) {
        formLocationSelect.value = currentFilter;
        // 觸發change事件來更新日期選項
        formLocationSelect.dispatchEvent(new Event('change'));
      }
      
      renderCalendar();
    });
  });
}


// Toast 提示功能
function showToast(type, title, message) {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: 'fas fa-check-circle',
    error: 'fas fa-exclamation-circle',
    warning: 'fas fa-exclamation-triangle',
    info: 'fas fa-info-circle'
  };
  
  toast.innerHTML = `
    <div class="toast-header">
      <i class="toast-icon ${icons[type]}"></i>
      <span class="toast-title">${title}</span>
    </div>
    <div class="toast-message">${message}</div>
  `;
  
  container.appendChild(toast);
  
  // 顯示動畫
  setTimeout(() => toast.classList.add('show'), 100);
  
  // 自動隱藏
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 4000);
}

// 載入狀態控制（支援HTML格式）
function showLoading(message = '處理中...') {
  const overlay = document.getElementById('loadingOverlay');
  const messageEl = document.getElementById('loadingMessage');
  
  // 檢查是否包含HTML標籤
  if (message.includes('<div') || message.includes('<span')) {
    messageEl.innerHTML = message;
  } else {
    messageEl.textContent = message;
  }
  
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function hideLoading() {
  const overlay = document.getElementById('loadingOverlay');
  overlay.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 防止重複提交的標記
let isSubmitting = false;

// 當前預約的 ID 和資訊（用於繳費彈窗上傳圖片）
let currentBookingId = null;
let currentBookingInfo = null; // 保存完整的預約資訊

// 表單提交
document.getElementById('submitBtn').addEventListener('click', async () => {
  console.log('表單提交按鈕被點擊');
  
  // 防止重複提交
  if (isSubmitting) {
    showToast('warning', '請稍候', '正在處理您的預約，請勿重複提交');
    return;
  }
  
  const vendor = document.getElementById('vendorName').value.trim();
  const loc = document.getElementById('location').value;
  const date = document.getElementById('availableDates').value;
  const foodType = document.getElementById('foodType').value;
  
  console.log('表單數據:', { vendor, loc, date, foodType });
  
  // 驗證表單
  if (!vendor || !loc || !date || !foodType) {
    showToast('error', '表單錯誤', '請完整填寫必要欄位');
    return;
  }
  
  // 設置提交中狀態
  isSubmitting = true;
  
  // 顯示載入狀態
  showLoading('🔍 檢查檔期可用性...');
  
  // 禁用提交按鈕
  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提交中...';
  submitBtn.disabled = true;
  
  // 多用戶環境下的預約鎖定機制
  const bookingKey = `${loc}_${date}_14:00-20:00`;
  const lockKey = `booking_lock_${bookingKey}`;
  
  // 檢查是否正在處理中
  if (sessionStorage.getItem(lockKey)) {
    hideLoading();
    showToast('error', '處理中', '該時段正在處理中，請稍後再試');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    isSubmitting = false;
    return;
  }
  
  // 設置處理鎖定
  sessionStorage.setItem(lockKey, 'true');
  
  try {
    // 檢查預約衝突
    const hasConflict = await checkBookingConflict(loc, date, '14:00-20:00');
    
    if (hasConflict) {
      hideLoading();
      showToast('error', '預約衝突', '該時段已被預約，請選擇其他日期或重新整理頁面查看最新狀態');
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isSubmitting = false;
      return;
    }
  } catch (error) {
    console.error('檢查預約衝突失敗:', error);
  } finally {
    // 清除處理鎖定
    sessionStorage.removeItem(lockKey);
  }
  
  // 檢查日曆上是否已有餐車名稱（本地檢查）
  const hasEvent = allEvents.some(event => {
    let eventDate;
    if (event.start instanceof Date) {
      eventDate = `${event.start.getFullYear()}-${String(event.start.getMonth() + 1).padStart(2, '0')}-${String(event.start.getDate()).padStart(2, '0')}`;
    } else {
      eventDate = event.start.split('T')[0];
    }
    return eventDate === date && event.location === loc;
  });
  
  if (hasEvent) {
    hideLoading();
    showToast('error', '日期衝突', '該日期已有餐車排班，請選擇其他日期');
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    isSubmitting = false;
    return;
  }
  
  // 更新載入訊息
  showLoading('📝 正在為您報名...');
  
  // 先上傳匯款圖片（如果有的話）
  let paymentImageUrl = null;
  const imageInput = document.getElementById('paymentImageInput');
  if (imageInput.files && imageInput.files.length > 0) {
    showLoading('📤 正在上傳匯款圖片...');
    try {
      paymentImageUrl = await uploadPaymentImage(imageInput.files[0], vendor, loc, date);
      console.log('✅ 圖片上傳成功:', paymentImageUrl);
    } catch (error) {
      console.error('圖片上傳失敗:', error);
      hideLoading();
      showToast('warning', '圖片上傳失敗', '將繼續提交預約，但圖片未上傳');
      // 繼續提交，不阻止預約
    }
  }
  
  // 準備提交數據
  const formData = {
    vendor,
    foodType,
    location: loc,
    date,
    timeSlot: '14:00-20:00',
    fee: '600',
    timestamp: formatTimestamp(),
    paymentImageUrl: paymentImageUrl // 添加圖片 URL
  };
  
  // 只提交到Google Sheets（GitHub已禁用）
  submitToGoogleSheets(formData)
    .then((result) => {
      console.log('Google Sheets提交結果:', result);
      
      // 隱藏載入狀態
      hideLoading();
      
      // 檢查Google Sheets提交結果
      if (result.success) {
        console.log('Google Sheets提交成功:', result);
        
        // 顯示成功提示
        showToast('success', '報名成功！', `🎉 ${vendor} 已成功預約\n📍 場地：${loc}\n📅 日期：${date}\n💰 場地費：600元`);
        
        // Google Sheets提交成功後，等待並多次同步數據
        setTimeout(async () => {
          try {
            console.log('⏱️ 等待2秒讓 Google Sheets 完成新增...');
          } catch (error) {}
        }, 2000);
        
        setTimeout(async () => {
          try {
            console.log('報名後第1次同步（3秒後）...');
            await fetchBookingsFromGoogleSheets();
            await fetchBookedDatesFromSheets();
            mergeSheetsDataToCalendar();
            renderCalendar();
            console.log('報名後第1次同步完成');
          } catch (error) {
            console.error('報名後第1次同步失敗:', error);
          }
        }, 3000);
        
        setTimeout(async () => {
          try {
            console.log('報名後第2次同步（5秒後）...');
            await fetchBookingsFromGoogleSheets();
            await fetchBookedDatesFromSheets();
            mergeSheetsDataToCalendar();
            renderCalendar();
            console.log('報名後第2次同步完成 - 日曆應該已更新');
          } catch (error) {
            console.error('報名後第2次同步失敗:', error);
          }
        }, 5000);
      } else {
        // Google Sheets提交失敗
        hideLoading();
        showToast('error', '報名失敗', '網路連線異常，請稍後再試');
        
        // 恢復按鈕狀態
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isSubmitting = false;
        return;
      }
      
      // Google Sheets提交成功，繼續處理
      if (result.success) {
        
        // 添加到事件列表（直接寫入日曆）
        const newEvent = {
          title: vendor,
          start: date,
          location: loc,
          color: '#28a745',
          timestamp: formatTimestamp(),
          foodType: foodType,
          fee: '600',
          payment: '尚未付款', // 初始付款狀態
          source: 'user_booking' // 標記為用戶預約
        };
        
        allEvents.push(newEvent);
        
        // 立即重新渲染日曆，顯示新預約
        renderCalendar();
        
        // 不再手動更新 bookedSlots，等待 Google Sheets 同步後自動重建
        // bookedSlots 會在 mergeSheetsDataToCalendar 中從 Sheets 重建
        
        // 保存到本地存儲（只保存 allEvents）
        saveToLocalStorage();
        
        // 保存當前預約 ID 和資訊（在重置表單之前）
        let savedBookingInfo = null;
        if (result.booking && result.booking.id) {
          currentBookingId = result.booking.id;
          savedBookingInfo = {
            id: result.booking.id,
            vendor: vendor,
            location: loc,
            date: date,
            foodType: foodType
          };
          console.log('✅ 已保存當前預約資訊:', savedBookingInfo);
        } else {
          console.warn('⚠️ 無法從 result.booking 獲取預約 ID，嘗試使用 currentBookingId');
          if (currentBookingId) {
            savedBookingInfo = {
              id: currentBookingId,
              vendor: vendor,
              location: loc,
              date: date,
              foodType: foodType
            };
            console.log('✅ 使用 currentBookingId:', savedBookingInfo);
          } else {
            console.error('❌ 無法獲取預約 ID，繳費彈窗可能無法正確上傳圖片');
          }
        }
        
        // 重置表單
        document.getElementById('vendorName').value = '';
        document.getElementById('location').value = currentLocation;
        document.getElementById('availableDates').value = '';
        document.getElementById('foodType').value = '';
        removePaymentImage(); // 清除圖片
        
        // 重新生成可用日期選項
        const availableDates = generateAvailableDates(loc);
        const dateSelect = document.getElementById('availableDates');
        dateSelect.innerHTML = '<option value="">選擇可用日期</option>';
        availableDates.forEach(date => {
          const opt = document.createElement('option');
          opt.value = date.value;
          opt.textContent = date.text;
          dateSelect.appendChild(opt);
        });
        
        // 恢復按鈕狀態
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        isSubmitting = false;
        
        // 將預約資訊保存到 sessionStorage，供繳費彈窗使用
        if (savedBookingInfo) {
          sessionStorage.setItem('currentBookingInfo', JSON.stringify(savedBookingInfo));
          console.log('💾 已將預約資訊保存到 sessionStorage');
        }
        
        // 顯示繳費彈窗
        showPaymentModal();
        
        // GitHub同步已禁用，依賴Google Sheets自動同步
        console.log('報名成功，Google Sheets將自動同步');
      }
    })
    .catch((error) => {
      // Google Sheets提交失敗
      console.error('提交失敗:', error);
      hideLoading();
      showToast('error', '報名失敗', '❌ 網路連線異常，請檢查網路後再試');
      
      // 恢復按鈕狀態
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
      isSubmitting = false;
    });
});

// ========== 匯款圖片上傳功能 ==========

// 上傳匯款圖片到 Supabase Storage
async function uploadPaymentImage(file, vendor, location, date) {
  if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
    throw new Error('Supabase 未啟用');
  }
  
  // 生成文件名：payment_images/場地/日期_餐車名稱_時間戳.擴展名
  // 注意：Supabase Storage 路徑需要使用 URL 安全的字符
  const timestamp = Date.now();
  
  // 將字符串轉換為 URL 安全的文件名
  // Supabase Storage 路徑需要使用 ASCII 字符，所以我們將中文轉換為拼音或使用編碼
  function sanitizeForPath(str) {
    if (!str) return 'unknown';
    // 簡單的場地名稱映射（將中文場地名稱轉為英文/拼音，避免路徑問題）
    const locationMap = {
      '四維路59號': 'siwei_59',
      '四維路60號': 'siwei_60',
      '漢堡大亨': 'hamburger',
      '自由風': 'ziyoufeng',
      '蔬蒔': 'shushi',
      '金正好吃': 'jinzhenghaochi'
    };
    
    // 餐車名稱也需要處理（移除特殊字符）
    const vendorMap = {};
    
    // 如果是已知的場地，使用映射
    if (locationMap[str]) {
      return locationMap[str];
    }
    
    // 否則，保留字母、數字、下劃線和連字號，其他字符轉為下劃線
    let sanitized = str.replace(/[^a-zA-Z0-9\-_]/g, '_');
    // 移除連續的下劃線
    sanitized = sanitized.replace(/_+/g, '_');
    // 移除開頭和結尾的下劃線
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    return sanitized || 'unknown';
  }
  
  // 處理餐車名稱（移除特殊字符，保留基本字符）
  function sanitizeVendor(str) {
    if (!str) return 'unknown';
    // 保留字母、數字、下劃線、連字號
    // 將中文字符轉換為拼音或使用下劃線（為了路徑兼容性）
    let sanitized = str.replace(/[^a-zA-Z0-9\-_]/g, '_');
    // 移除連續的下劃線
    sanitized = sanitized.replace(/_+/g, '_');
    // 移除開頭和結尾的下劃線
    sanitized = sanitized.replace(/^_+|_+$/g, '');
    // 限制長度（避免文件名過長）
    sanitized = sanitized.substring(0, 50);
    return sanitized || 'unknown';
  }
  
  const sanitizedVendor = sanitizeVendor(vendor);
  const sanitizedLocation = sanitizeForPath(location);
  const sanitizedDate = date.replace(/-/g, '');
  const fileExt = file.name.split('.').pop().toLowerCase();
  const fileName = `payment_images/${sanitizedLocation}/${sanitizedDate}_${sanitizedVendor}_${timestamp}.${fileExt}`;
  
  console.log('📤 上傳圖片到:', fileName);
  
  // 上傳文件
  const { data, error } = await supabaseClient.storage
    .from('foodcarcalss')
    .upload(fileName, file, {
      contentType: file.type || 'image/jpeg',
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) {
    console.error('圖片上傳錯誤:', error);
    console.error('錯誤詳情:', JSON.stringify(error, null, 2));
    
    // 提供更友好的錯誤訊息
    if (error.message && error.message.includes('Bucket not found')) {
      throw new Error('Storage bucket 不存在，請聯繫管理員設置');
    } else if (error.message && error.message.includes('row-level security')) {
      throw new Error('權限不足，請聯繫管理員設置 Storage 權限');
    } else if (error.message && error.message.includes('already exists')) {
      // 如果文件已存在，使用 upsert 重新上傳
      console.log('文件已存在，嘗試覆蓋...');
      const { data: upsertData, error: upsertError } = await supabaseClient.storage
        .from('foodcarcalss')
        .update(fileName, file, {
          contentType: file.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: true
        });
      
      if (upsertError) {
        throw new Error('圖片上傳失敗: ' + upsertError.message);
      }
      
      // 使用更新後的數據
      const { data: urlData } = supabaseClient.storage
        .from('foodcarcalss')
        .getPublicUrl(fileName);
      
      if (!urlData || !urlData.publicUrl) {
        throw new Error('無法獲取圖片公開 URL');
      }
      
      console.log('✅ 圖片上傳成功（覆蓋）:', urlData.publicUrl);
      return urlData.publicUrl;
    }
    
    throw error;
  }
  
  // 獲取公開 URL
  const { data: urlData } = supabaseClient.storage
    .from('foodcarcalss')
    .getPublicUrl(fileName);
  
  if (!urlData || !urlData.publicUrl) {
    throw new Error('無法獲取圖片公開 URL');
  }
  
  console.log('✅ 圖片上傳成功，URL:', urlData.publicUrl);
  return urlData.publicUrl;
}

// 處理圖片選擇
document.addEventListener('DOMContentLoaded', function() {
  const imageInput = document.getElementById('paymentImageInput');
  if (imageInput) {
    imageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // 驗證文件類型
        if (!file.type.startsWith('image/')) {
          showToast('error', '檔案格式錯誤', '請選擇圖片檔案（JPG、PNG 等）');
          e.target.value = '';
          return;
        }
        
        // 驗證文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
          showToast('error', '檔案太大', '圖片大小不能超過 5MB');
          e.target.value = '';
          return;
        }
        
        // 顯示預覽
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('imagePreview');
          const previewImg = document.getElementById('previewImage');
          if (preview && previewImg) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// 移除圖片
function removePaymentImage() {
  const imageInput = document.getElementById('paymentImageInput');
  const preview = document.getElementById('imagePreview');
  
  if (imageInput) imageInput.value = '';
  if (preview) preview.style.display = 'none';
}

// 暴露到全局
window.removePaymentImage = removePaymentImage;

// ========== 繳費彈窗圖片上傳功能 ==========

// 處理繳費彈窗圖片選擇
document.addEventListener('DOMContentLoaded', function() {
  const paymentImageInput = document.getElementById('paymentModalImageInput');
  if (paymentImageInput) {
    paymentImageInput.addEventListener('change', function(e) {
      const file = e.target.files[0];
      if (file) {
        // 驗證文件類型
        if (!file.type.startsWith('image/')) {
          showToast('error', '檔案格式錯誤', '請選擇圖片檔案（JPG、PNG 等）');
          e.target.value = '';
          return;
        }
        
        // 驗證文件大小（最大 5MB）
        if (file.size > 5 * 1024 * 1024) {
          showToast('error', '檔案太大', '圖片大小不能超過 5MB');
          e.target.value = '';
          return;
        }
        
        // 顯示預覽
        const reader = new FileReader();
        reader.onload = function(e) {
          const preview = document.getElementById('paymentModalImagePreview');
          const previewImg = document.getElementById('paymentModalPreviewImage');
          const uploadBtn = document.getElementById('uploadPaymentImageBtn');
          
          if (preview && previewImg) {
            previewImg.src = e.target.result;
            preview.style.display = 'block';
          }
          
          if (uploadBtn) {
            uploadBtn.style.display = 'block';
          }
        };
        reader.readAsDataURL(file);
      }
    });
  }
});

// 移除繳費彈窗圖片
function removePaymentModalImage() {
  const imageInput = document.getElementById('paymentModalImageInput');
  const preview = document.getElementById('paymentModalImagePreview');
  const uploadBtn = document.getElementById('uploadPaymentImageBtn');
  
  if (imageInput) imageInput.value = '';
  if (preview) preview.style.display = 'none';
  if (uploadBtn) uploadBtn.style.display = 'none';
}

// 從繳費彈窗上傳圖片
async function uploadPaymentImageFromModal() {
  const imageInput = document.getElementById('paymentModalImageInput');
  const uploadBtn = document.getElementById('uploadPaymentImageBtn');
  
  if (!imageInput || !imageInput.files || imageInput.files.length === 0) {
    showToast('error', '請選擇圖片', '請先選擇要上傳的匯款圖片');
    return;
  }
  
  // 優先從 sessionStorage 獲取預約資訊
  let bookingInfo = currentBookingInfo;
  if (!bookingInfo) {
    const savedInfo = sessionStorage.getItem('currentBookingInfo');
    if (savedInfo) {
      try {
        bookingInfo = JSON.parse(savedInfo);
        currentBookingInfo = bookingInfo;
        currentBookingId = bookingInfo.id;
      } catch (e) {
        console.error('無法解析保存的預約資訊:', e);
      }
    }
  }
  
  // 如果還是沒有，嘗試從表單獲取（雖然表單可能已重置）
  if (!bookingInfo || !currentBookingId) {
    const vendor = document.getElementById('vendorName')?.value;
    const location = document.getElementById('location')?.value;
    const date = document.getElementById('availableDates')?.value;
    
    if (vendor && location && date) {
      console.warn('⚠️ 使用表單中的資訊（預約 ID 可能不正確）');
      bookingInfo = {
        vendor: vendor,
        location: location,
        date: date
      };
    } else {
      showToast('error', '錯誤', '無法識別當前預約，請重新提交預約後再上傳圖片');
      return;
    }
  }
  
  // 確保有預約 ID
  if (bookingInfo && bookingInfo.id) {
    currentBookingId = bookingInfo.id;
  }
  
  if (!currentBookingId) {
    showToast('error', '錯誤', '無法識別當前預約 ID，請重新提交預約後再上傳圖片');
    console.error('❌ 無法獲取預約 ID');
    console.error('   - currentBookingId:', currentBookingId);
    console.error('   - bookingInfo:', bookingInfo);
    console.error('   - sessionStorage:', sessionStorage.getItem('currentBookingInfo'));
    return;
  }
  
  const file = imageInput.files[0];
  
  // 禁用上傳按鈕
  if (uploadBtn) {
    uploadBtn.disabled = true;
    uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 上傳中...';
  }
  
  showLoading('📤 正在上傳匯款圖片...');
  
  try {
    // 使用保存的預約資訊（優先）或從表單獲取
    const vendor = bookingInfo?.vendor || document.getElementById('vendorName')?.value || 'unknown';
    const location = bookingInfo?.location || document.getElementById('location')?.value || 'unknown';
    const date = bookingInfo?.date || document.getElementById('availableDates')?.value || new Date().toISOString().split('T')[0];
    
    console.log('📤 上傳圖片資訊:');
    console.log('   - 預約 ID:', currentBookingId);
    console.log('   - 餐車:', vendor);
    console.log('   - 場地:', location);
    console.log('   - 日期:', date);
    
    // 上傳圖片
    const imageUrl = await uploadPaymentImage(file, vendor, location, date);
    
    // 更新資料庫中的 payment_image_url
    if (!SUPABASE_CONFIG.enabled || !supabaseClient) {
      throw new Error('Supabase 未啟用');
    }
    
    const { data, error } = await supabaseClient
      .from('foodcarcalss')
      .update({ payment_image_url: imageUrl })
      .eq('id', currentBookingId)
      .select()
      .single();
    
    if (error) throw error;
    
    hideLoading();
    showToast('success', '上傳成功', '匯款圖片已上傳，管理員將盡快審核');
    
    // 隱藏上傳按鈕，顯示成功狀態
    if (uploadBtn) {
      uploadBtn.style.display = 'none';
    }
    
    // 更新預覽顯示（可選：顯示已上傳標記）
    const preview = document.getElementById('paymentModalImagePreview');
    if (preview) {
      preview.classList.add('uploaded');
    }
    
    // 清除 sessionStorage 中的預約資訊（可選，或保留以便後續操作）
    // sessionStorage.removeItem('currentBookingInfo');
    
  } catch (error) {
    console.error('上傳匯款圖片失敗:', error);
    hideLoading();
    showToast('error', '上傳失敗', error.message || '無法上傳圖片，請稍後再試');
    
    // 恢復上傳按鈕
    if (uploadBtn) {
      uploadBtn.disabled = false;
      uploadBtn.innerHTML = '<i class="fas fa-upload"></i> 上傳圖片';
    }
  }
}

// 暴露到全局
window.removePaymentModalImage = removePaymentModalImage;
window.uploadPaymentImageFromModal = uploadPaymentImageFromModal;

// 繳費彈窗相關函數
function showPaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden'; // 防止背景滾動
  
  // 重置圖片上傳區域
  removePaymentModalImage();
  
  // 從 sessionStorage 恢復預約資訊（如果有的話）
  const savedInfo = sessionStorage.getItem('currentBookingInfo');
  if (savedInfo) {
    try {
      currentBookingInfo = JSON.parse(savedInfo);
      if (currentBookingInfo && currentBookingInfo.id) {
        currentBookingId = currentBookingInfo.id;
        console.log('✅ 從 sessionStorage 恢復預約資訊:', currentBookingInfo);
        console.log('   - 預約 ID:', currentBookingId);
        console.log('   - 餐車:', currentBookingInfo.vendor);
        console.log('   - 場地:', currentBookingInfo.location);
        console.log('   - 日期:', currentBookingInfo.date);
        
        // 在繳費彈窗中顯示預約資訊
        const bookingInfoDiv = document.getElementById('paymentBookingInfo');
        const bookingDetails = document.getElementById('paymentBookingDetails');
        if (bookingInfoDiv && bookingDetails) {
          bookingDetails.textContent = `${currentBookingInfo.vendor || ''} - ${currentBookingInfo.location || ''} - ${currentBookingInfo.date || ''}`;
          bookingInfoDiv.style.display = 'block';
        }
      }
    } catch (e) {
      console.error('無法解析保存的預約資訊:', e);
    }
  } else {
    console.warn('⚠️ sessionStorage 中沒有預約資訊，請確認預約是否成功提交');
    // 隱藏預約資訊顯示
    const bookingInfoDiv = document.getElementById('paymentBookingInfo');
    if (bookingInfoDiv) {
      bookingInfoDiv.style.display = 'none';
    }
  }
}

function closePaymentModal() {
  const modal = document.getElementById('paymentModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto'; // 恢復滾動
  
  // 重置圖片上傳區域
  removePaymentModalImage();
  
  // 可選：清除 sessionStorage 中的預約資訊（如果不需要保留）
  // sessionStorage.removeItem('currentBookingInfo');
}

function showBankModal() {
  const modal = document.getElementById('bankModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeBankModal() {
  const modal = document.getElementById('bankModal');
  modal.classList.remove('active');
  document.body.style.overflow = 'auto';
}

// 付款方式按鈕函數
function openJkopay() {
  // 街口支付連結
  window.open('https://www.jkos.com/contact-person?j=ContactPerson:901644985', '_blank');
  showToast('info', '街口支付', '已開啟街口支付頁面，請完成付款後將截圖傳至官方小幫手');
}

function openLinepay() {
  // LINE-PAY連結
  window.open('https://line.me/ti/p/natrAYmeWy', '_blank');
  showToast('info', 'LINE-PAY', '已開啟LINE-PAY頁面，請完成付款後將截圖傳至官方小幫手');
}

function openBankModal() {
  closePaymentModal();
  showBankModal();
}

function openOfficialAccount() {
  // 官方小幫手連結
  window.open('https://lin.ee/BStZlfM', '_blank');
  showToast('info', '官方小幫手', '已開啟官方小幫手，請將付款截圖或訊息傳送給我們');
}

// 複製帳號功能
function copyAccountNumber() {
  const accountNumber = document.getElementById('accountNumber').textContent;
  
  // 使用現代瀏覽器的 Clipboard API
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(accountNumber).then(() => {
      showToast('success', '複製成功', '銀行帳號已複製到剪貼簿');
    }).catch(() => {
      fallbackCopyTextToClipboard(accountNumber);
    });
  } else {
    fallbackCopyTextToClipboard(accountNumber);
  }
}

// 備用複製方法
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.style.position = 'fixed';
  textArea.style.left = '-999999px';
  textArea.style.top = '-999999px';
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      showToast('success', '複製成功', '銀行帳號已複製到剪貼簿');
    } else {
      showToast('error', '複製失敗', '請手動複製帳號：' + text);
    }
  } catch (err) {
    showToast('error', '複製失敗', '請手動複製帳號：' + text);
  }
  
  document.body.removeChild(textArea);
}


// 設定最小日期為今天
document.getElementById('date').min = new Date().toISOString().split('T')[0];

// 系統版本號
const SYSTEM_VERSION = '3.2.3';

// 檢測LINE瀏覽器並添加特殊類名
function detectLineApp() {
  const ua = navigator.userAgent.toLowerCase();
  const isLine = ua.indexOf('line') > -1;
  const isWebView = /(iphone|ipod|ipad).*applewebkit(?!.*safari)|android.*applewebkit/i.test(ua);
  
  console.log('========================================');
  console.log('🚚 楊梅餐車排班系統 v' + SYSTEM_VERSION);
  console.log('========================================');
  console.log('瀏覽器資訊:', ua);
  console.log('是否為LINE:', isLine);
  console.log('是否為WebView:', isWebView);
  
  if (isLine || isWebView) {
    document.body.classList.add('line-browser');
    console.log('✅ 已啟用 LINE/WebView 兼容模式');
    console.log('- 餐車名稱：水平顯示（自動換行）');
    console.log('- 字體大小：固定值（不使用動態縮放）');
    
    // 更新頁面底部顯示
    setTimeout(() => {
      const modeDisplay = document.getElementById('browserMode');
      if (modeDisplay) {
        modeDisplay.innerHTML = '<span style="color: #ffc107;">LINE兼容模式</span>';
      }
    }, 100);
    
    // 顯示提示訊息（美化訊息）
    setTimeout(() => {
      showToast('info', '歡迎光臨', '🎨 已優化顯示模式，為您呈現最佳體驗');
    }, 1000);
  } else {
    console.log('✅ 標準模式');
    console.log('- 餐車名稱：垂直顯示');
    console.log('- 字體大小：自動縮放');
    
    // 更新頁面底部顯示
    setTimeout(() => {
      const modeDisplay = document.getElementById('browserMode');
      if (modeDisplay) {
        modeDisplay.innerHTML = '<span style="color: #2ecc71;">標準模式</span>';
      }
    }, 100);
  }
  console.log('========================================');
  
  return isLine || isWebView;
}

// 檢查是否需要強制刷新緩存
function checkVersionAndRefresh() {
  const storedVersion = localStorage.getItem('system_version');
  
  if (storedVersion !== SYSTEM_VERSION) {
    console.log('🔄 檢測到新版本，清除所有舊緩存...');
    console.log('舊版本:', storedVersion || '未知');
    console.log('新版本:', SYSTEM_VERSION);
    
    // 清除所有舊的預約數據（只保留Google Sheets數據）
    console.log('清除本地預約數據...');
    localStorage.removeItem('foodtruck_bookings');
    localStorage.removeItem('foodtruck_bookedSlots');
    
    // 清空內存中的事件
    allEvents.length = 0;
    Object.keys(bookedSlots).forEach(location => {
      bookedSlots[location] = {};
    });
    
    // 儲存新版本號
    localStorage.setItem('system_version', SYSTEM_VERSION);
    
    // 顯示更新提示
    setTimeout(() => {
      showToast('success', '系統已更新', `✨ 已更新至 v${SYSTEM_VERSION}\n🔄 已清除舊資料，重新整理排班`);
    }, 500);
    
    return true; // 表示已清除數據
  }
  
  return false; // 沒有清除數據
}

// 強制只顯示Google Sheets的數據
function syncOnlySheetsData() {
  console.log('========================================');
  console.log('📊 強制只顯示 Google Sheets 數據');
  console.log('========================================');
  
  // 清空所有本地數據
  allEvents.length = 0;
  Object.keys(bookedSlots).forEach(location => {
    bookedSlots[location] = {};
  });
  
  console.log('✅ 已清空本地數據');
  console.log('⏳ 等待從 Google Sheets 同步...');
}

// 頁面載入時檢測
detectLineApp();
checkVersionAndRefresh();

// 圖片放大功能
document.addEventListener('DOMContentLoaded', async function() {
  // v2.4.0：完全依賴Google Sheets，清除所有本地緩存
  console.log('========================================');
  console.log('📋 系統初始化中... (v2.4.0)');
  console.log('========================================');
  console.log('🚫 不使用本地緩存數據（已停用localStorage）');
  console.log('✅ 完全從 Google Sheets 同步數據');
  console.log('✅ 每次刷新都顯示 Google Sheets 最新資料');
  
  // 顯示載入畫面（吉利語）
  showLoading(`<div style="font-size: 1.3rem; font-weight: 700; margin-bottom: 10px; color: #FF4B2B; letter-spacing: 2px;">🎊 好運降臨</div><div style="font-size: 0.85rem; color: #999; font-weight: 500;">系統啟動中...</div>`);
  
  // 強制清空所有本地數據
  allEvents.length = 0;
  Object.keys(bookedSlots).forEach(location => {
    bookedSlots[location] = {};
  });
  
  console.log('✅ 本地數據已清空');
  console.log('========================================');
  
  // 初始化新行事曆（此時為空，不顯示）
  initNewCalendar();
  
  // 設定預設場地
  updateLocationInfo(currentLocation);
  document.getElementById('location').value = currentLocation;
  
  // 觸發場地選擇事件以初始化日期選擇器
  document.getElementById('location').dispatchEvent(new Event('change'));
  
  // 啟動定期同步
  startPeriodicSync();
  
  // 啟動Google Sheets定期同步
  startSheetsSyncInterval();
  
  // 頁面載入時顯示同步狀態
  showSyncStatus('系統初始化中...', 'default');
  
  // GitHub同步已禁用，系統完全依賴 Supabase
  console.log('系統完全依賴 Supabase，GitHub同步已禁用');
  
  // if (!hasLocalData) {
  //   await syncWithGitHub();
  // } else {
  //   setTimeout(async () => {
  //     await syncWithGitHub();
  //   }, 1000);
  // }
  
  // 初次載入時同步 Supabase 數據（v3.2.3：快取優先，完整載入後顯示）
  if (SUPABASE_CONFIG.enabled && supabaseClient) {
    // 記錄開始時間
    const startTime = Date.now();
    
    // 嘗試載入本地快取
    const hasCachedData = loadFromLocalStorage();
    
    if (hasCachedData) {
      // 有快取：立即顯示快取數據
      console.log('🚀 使用快取數據快速啟動');
      showLoading('📦 載入快取...');
      
      // 合併快取數據到日曆
      mergeSheetsDataToCalendar();
      
      // 重新生成當前場地的可用日期
      const currentLoc = document.getElementById('location').value;
      if (currentLoc) {
        document.getElementById('location').dispatchEvent(new Event('change'));
      }
      
      // 300ms後顯示頁面
      setTimeout(() => {
        hideLoading();
        const mainContent = document.getElementById('mainContent');
        if (mainContent) {
          mainContent.style.opacity = '1';
        }
        showSyncStatus('使用快取資料', 'success');
        console.log(`✅ 快取啟動完成，耗時: ${((Date.now() - startTime) / 1000).toFixed(1)}秒`);
      }, 300);
      
      // 背景同步最新數據
      setTimeout(async () => {
        try {
          console.log('🔄 背景更新最新數據...');
          showSyncStatus('背景更新中...', 'default');
          
          await Promise.all([
            fetchBookingsFromGoogleSheets(),
            fetchBookedDatesFromSheets()
          ]);
          
          // 保存到快取
          saveToLocalStorage();
          
          // 更新日曆
          mergeSheetsDataToCalendar();
          
          // 重新生成當前場地的可用日期
          const currentLoc = document.getElementById('location').value;
          if (currentLoc) {
            document.getElementById('location').dispatchEvent(new Event('change'));
          }
          
          showSyncStatus('更新完成', 'success');
          console.log('✅ 背景更新完成');
        } catch (error) {
          console.error('背景更新失敗:', error);
          showSyncStatus('使用快取資料', 'warning');
        }
      }, 1000);
      
      return; // 使用快取流程結束
    }
    
    // 無快取：完整載入後才顯示
    console.log('📡 首次載入，正在同步 Google Sheets...');
    showLoading('🎊 好運降臨...');
    
    // 添加秒數計時器
    let loadingSeconds = 0;
    const loadingTimer = setInterval(() => {
      loadingSeconds++;
      showLoading(`<div style="font-size: 1.25rem; font-weight: 700; margin-bottom: 10px; color: #FF4B2B; letter-spacing: 2px;">🎊 好運降臨</div><div style="font-size: 0.85rem; color: #999; font-weight: 500;">載入中 · ${loadingSeconds} 秒</div>`);
    }, 1000);
    
    // 立即開始同步（班表載入完就顯示，其他背景處理）
    (async () => {
      try {
        const syncStartTime = Date.now();
        console.log('⏱️ 開始同步 Google Sheets...');
        
        // 優先載入排班數據（最重要）
        await fetchBookingsFromGoogleSheets();
        
        // 合併數據到日曆
        mergeSheetsDataToCalendar();
        
        // 計算載入時間
        const syncDuration = ((Date.now() - syncStartTime) / 1000).toFixed(1);
        const totalDuration = ((Date.now() - startTime) / 1000).toFixed(1);
        
        console.log('========================================');
        console.log('✅ 排班數據載入完成');
        console.log(`⏱️ 載入耗時: ${syncDuration} 秒`);
        console.log(`📊 載入預約數: ${allEvents.length}`);
        console.log('========================================');
        
        // 停止計時器
        clearInterval(loadingTimer);
        
        // 顯示成功訊息並立即顯示頁面
        const totalBookings = allEvents.length;
        const successMessage = totalBookings > 0 
          ? `<div style="font-size: 1.35rem; font-weight: 700; margin-bottom: 10px; color: #28a745; letter-spacing: 2px;">🎉 萬事如意</div><div style="font-size: 0.9rem; color: #666; font-weight: 500;">已載入 ${totalBookings} 個排班 · 準備就緒</div>`
          : `<div style="font-size: 1.35rem; font-weight: 700; margin-bottom: 10px; color: #28a745; letter-spacing: 2px;">🎊 一切順利</div><div style="font-size: 0.9rem; color: #666; font-weight: 500;">目前無排班資料 · 準備就緒</div>`;
        
        showLoading(successMessage);
        setTimeout(() => {
          hideLoading();
          const mainContent = document.getElementById('mainContent');
          if (mainContent) {
            mainContent.style.opacity = '1';
          }
          showSyncStatus('班表已載入', 'success');
          console.log(`✅ 頁面已顯示，總耗時: ${totalDuration} 秒`);
        }, 300);
        
        // 背景載入已預約日期（不阻塞頁面顯示）
        setTimeout(async () => {
          try {
            console.log('🔄 背景載入已預約日期...');
            await fetchBookedDatesFromSheets();
            
            // 保存完整數據到快取
            saveToLocalStorage();
            
            // 重新生成當前場地的可用日期
            const currentLoc = document.getElementById('location').value;
            if (currentLoc) {
              document.getElementById('location').dispatchEvent(new Event('change'));
            }
            
            console.log('✅ 已預約日期載入完成');
          } catch (error) {
            console.error('背景載入已預約日期失敗:', error);
          }
        }, 500);
        
      } catch (error) {
        console.error('初次同步Google Sheets失敗:', error);
        
        // 停止計時器
        clearInterval(loadingTimer);
        
        // 顯示錯誤訊息
        showLoading(`<div style="font-size: 1.3rem; font-weight: 700; margin-bottom: 10px; color: #dc3545; letter-spacing: 2px;">❌ 連線失敗</div><div style="font-size: 0.85rem; color: #999; font-weight: 500;">無法連接 Google Sheets</div>`);
        
        setTimeout(() => {
          hideLoading();
          const mainContent = document.getElementById('mainContent');
          if (mainContent) {
            mainContent.style.opacity = '1';
          }
          showSyncStatus('連線失敗', 'error');
          showToast('error', '載入失敗', '❌ 無法載入排班資料，請檢查網路連線後重新整理');
        }, 1500);
        
        console.log('⚠️ 首次載入失敗，建議使用者重新整理頁面');
      }
    })(); // 立即執行同步
  } else {
    // 如果未啟用Google Sheets，直接隱藏載入畫面並顯示內容
    hideLoading();
    const mainContent = document.getElementById('mainContent');
    if (mainContent) {
      mainContent.style.opacity = '1';
    }
  }
  
  // 圖片點擊放大功能
  document.querySelectorAll('.location-thumbnail').forEach(thumbnail => {
    thumbnail.addEventListener('click', function(e) {
      e.stopPropagation(); // 防止觸發場地切換
      const fullImageSrc = this.getAttribute('data-full-image');
      const modal = document.getElementById('imageModal');
      const modalImage = document.getElementById('modalImage');
      
      modalImage.src = fullImageSrc;
      modalImage.alt = this.alt;
      modal.classList.add('active');
    });
  });
  
  // 關閉模態框
  document.querySelector('.modal-close').addEventListener('click', function() {
    document.getElementById('imageModal').classList.remove('active');
  });
  
  // 點擊模態框背景關閉
  document.getElementById('imageModal').addEventListener('click', function(e) {
    if (e.target === this) {
      this.classList.remove('active');
    }
  });
  
  // ESC鍵關閉模態框
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.getElementById('imageModal').classList.remove('active');
      document.getElementById('paymentModal').classList.remove('active');
      document.getElementById('bankModal').classList.remove('active');
      document.getElementById('cancelModal').classList.remove('active');
      document.getElementById('passwordModal').classList.remove('active');
      document.getElementById('transferModal').classList.remove('active');
      document.getElementById('takeoverModal').classList.remove('active');
      document.getElementById('helpModal').classList.remove('active');
      document.getElementById('rulesModal').classList.remove('active');
      document.getElementById('downloadModal').classList.remove('active');
      document.getElementById('activityModal').classList.remove('active');
      document.body.style.overflow = 'auto';
    }
  });
  
  // 點擊背景關閉繳費彈窗
  document.getElementById('paymentModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closePaymentModal();
    }
  });
  
  // 點擊背景關閉銀行轉帳彈窗
  document.getElementById('bankModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeBankModal();
    }
  });
  
  // 點擊背景關閉取消預約彈窗
  document.getElementById('cancelModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeCancelModal();
    }
  });
  
  // 點擊背景關閉密碼輸入彈窗
  document.getElementById('passwordModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closePasswordModal();
    }
  });
  
  // 密碼輸入框Enter鍵支援
  document.getElementById('passwordInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      verifyPassword();
    }
  });
  
  // 點擊背景關閉排班釋出彈窗
  document.getElementById('transferModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeTransferModal();
    }
  });
  
  // 釋出彈窗密碼輸入框Enter鍵支援
  document.getElementById('transferPassword').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
      submitTransfer();
    }
  });
  
  // 點擊背景關閉使用教學彈窗
  document.getElementById('helpModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeHelpModal();
    }
  });
  
  // 點擊背景關閉群組版規彈窗
  document.getElementById('rulesModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeRulesModal();
    }
  });
  
  // 點擊背景關閉下載素材彈窗
  document.getElementById('downloadModal').addEventListener('click', function(e) {
    if (e.target === this) {
      closeDownloadModal();
    }
  });
});
