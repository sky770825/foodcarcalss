// Google Apps Script 代碼 - 用於接收餐車報名數據
// 請將此代碼複製到 Google Apps Script 中

// 時間戳記格式化函數（只到秒數，保留Z）
function formatTimestamp(date) {
  if (!date) date = new Date();
  return date.toISOString().split('.')[0] + 'Z'; // 移除毫秒，保留Z
}

// 日期格式化函數（ISO格式 → Google Sheets格式）
function formatDateForSheet(isoDate) {
  try {
    // 檢查輸入是否有效
    if (!isoDate) {
      console.log('日期為空，返回空字符串');
      return '';
    }
    
    // 轉換為字符串
    const dateStr = String(isoDate);
    
    // 如果已經是 Google Sheets 格式（例如：10月13日(星期一)），直接返回
    if (dateStr.includes('月') && dateStr.includes('日')) {
      return dateStr;
    }
    
    // 解析 ISO 格式日期（例如：2025-10-13），加上 T00:00:00 避免 UTC 偏移
    const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');

    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      console.log('無效的日期格式:', dateStr);
      return dateStr;
    }
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = dayNames[date.getDay()];
    
    return `${month}月${day}日(${dayName})`;
  } catch (error) {
    console.error('日期格式化失敗:', error);
    return isoDate || ''; // 返回原始值或空字符串
  }
}

function doGet(e) {
  // 檢查是否有獲取數據請求
  if (e.parameter.action === 'getBookings') {
    return getAllBookings();
  }
  // 檢查是否有獲取已預約日期請求
  else if (e.parameter.action === 'getBookedDates') {
    return getBookedDates();
  }
  // 檢查是否有取消預約參數
  else if (e.parameter.action === 'cancel' && e.parameter.vendor) {
    // 處理取消預約
    const cancelData = {
      vendor: e.parameter.vendor || '未提供',
      location: e.parameter.location || '未提供',
      date: e.parameter.date || '未提供',
      timeSlot: e.parameter.timeSlot || '14:00-20:00',
      cancelledAt: e.parameter.cancelledAt || formatTimestamp()
    };
    
    const result = cancelBookingFromSheet(cancelData);
    
    return wrapJsonpIfNeeded(e, result);
  }
  // 檢查是否有報名數據參數
  else if (e.parameter.vendor) {
    // 有報名數據，處理報名
    const bookingData = {
      vendor: e.parameter.vendor || '未提供',
      location: e.parameter.location || '未提供',
      date: e.parameter.date || '未提供',
      timeSlot: e.parameter.timeSlot || '14:00-20:00',
      foodType: e.parameter.foodType || '未提供',
      fee: e.parameter.fee || '600',
      timestamp: e.parameter.timestamp || formatTimestamp()
    };

    const result = addBookingToSheet(bookingData);
    return wrapJsonpIfNeeded(e, result);
  } else {
    // 沒有報名數據，返回狀態信息
    const response = {
      status: 'success',
      message: '餐車排班報名系統運行正常',
      timestamp: formatTimestamp()
    };

    const result = ContentService
      .createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
    return wrapJsonpIfNeeded(e, result);
  }
}

// 安全的 JSONP 包裝函數（防止 callback 注入）
function wrapJsonpIfNeeded(e, result) {
  if (e.parameter.callback) {
    const callback = e.parameter.callback;
    // 驗證 callback 名稱只包含安全字元（字母、數字、底線、點）
    if (!/^[a-zA-Z_$][a-zA-Z0-9_$.]*$/.test(callback)) {
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, message: 'Invalid callback name' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    const content = typeof result.getContent === 'function' ? result.getContent() : JSON.stringify(result);
    const jsonpResponse = `${callback}(${content})`;
    return ContentService
      .createTextOutput(jsonpResponse)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  } else {
    return result;
  }
}

function doPost(e) {
  try {
    let data;
    
    // 檢查是否為表單數據格式
    if (e.postData.type === 'application/x-www-form-urlencoded') {
      // 處理表單數據
      const formData = e.parameter;
      if (formData.data) {
        data = JSON.parse(formData.data);
      } else {
        // 直接從表單參數構建數據
        data = {
          vendor: formData.vendor || '未提供',
          location: formData.location || '未提供',
          date: formData.date || '未提供',
          timeSlot: formData.timeSlot || '14:00-20:00',
          foodType: formData.foodType || '未提供',
          fee: formData.fee || '600',
          timestamp: formData.timestamp || formatTimestamp()
        };
      }
    } else {
      // 處理 JSON 數據
      data = JSON.parse(e.postData.contents);
    }
    
    console.log('========== doPost 收到的數據 ==========');
    console.log('action:', data.action, '(類型:', typeof data.action + ')');
    console.log('vendor:', data.vendor);
    console.log('rowNumber:', data.rowNumber, '(類型:', typeof data.rowNumber + ')');
    console.log('payment:', data.payment);
    console.log('完整數據:', JSON.stringify(data));
    console.log('===================================');
    
    // ✅ 優先檢查更新付款狀態請求（審計功能）- 放在最前面
    if (data.action === 'updatePayment') {
      console.log('🔍 檢測到 updatePayment 請求！');
      console.log('→ 執行 updatePaymentStatus');
      return updatePaymentStatus(data);
    }
    
    // 檢查是否有更新預約請求（後台管理）
    if (data.action === 'updateBooking') {
      console.log('→ 執行 updateBooking');
      return updateBooking(data);
    }
    
    // 檢查是否有接手預約請求
    if (data.action === 'takeover') {
      console.log('→ 執行 takeoverBooking');
      return takeoverBooking(data);
    }
    
    // 檢查是否有排班釋出請求
    if (data.action === 'transfer') {
      console.log('→ 執行 transferBooking');
      return transferBooking(data);
    }
    
    // 檢查是否有刪除預約請求
    if (data.action === 'delete') {
      console.log('→ 執行 deleteBooking');
      return deleteBooking(data);
    }
    
    // 直接處理報名數據
    console.log('⚠️ 沒有 action 或 action 不匹配，執行 addBookingToSheet（新增預約）');
    console.log('⚠️ 如果這不應該新增，請檢查 action 參數');
    return addBookingToSheet(data);
      
  } catch (error) {
    console.error('處理請求時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '服務器錯誤: ' + error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addBookingToSheet(bookingData) {
  try {
    // 記錄接收到的數據用於調試
    console.log('接收到的數據:', JSON.stringify(bookingData));
    
    // 使用指定的 Google Sheets ID
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('電子表格名稱:', spreadsheet.getName());
    
    // 嘗試獲取名為 "Form_Responses1" 的工作表，如果不存在則創建
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    if (!sheet) {
      sheet = spreadsheet.insertSheet('Form_Responses1');
      // 添加標題行 - 匹配您 Google Sheets 第7行的格式
      sheet.getRange(7, 1, 1, 9).setValues([[
        '時間戳記', '您的店名', '餐車類型', '預約場地', '預約日期', 
        '己排', '場地費', '款項結清', '備註'
      ]]);
      // 設定標題行格式
      sheet.getRange(7, 1, 1, 9).setFontWeight('bold');
      sheet.getRange(7, 1, 1, 9).setBackground('#e1f5fe');
      sheet.getRange(7, 1, 1, 9).setBorder(true, true, true, true, true, true);
    }
    
    console.log('工作表名稱:', sheet.getName());
    
    // 格式化日期為「10月16日(星期一)」格式
    function formatDate(dateStr) {
      if (!dateStr || dateStr === '未提供') return '未提供';

      // 加上 T00:00:00 避免 UTC 偏移導致日期差一天
      const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const dayName = dayNames[date.getDay()];
      
      return `${month}月${day}日(${dayName})`;
    }
    
    // 場地名稱到地址的對應關係
    function getLocationAddress(locationName) {
      const locationMap = {
        '四維路59號': '四維路59號',
        '四維路60號': '四維路60號',
        '漢堡大亨': '四維路70號',
        '自由風': '四維路190號',
        '蔬蒔': '四維路216號',
        '金正好吃': '四維路218號'
      };
      
      return locationMap[locationName] || locationName || '未提供';
    }
    
    // 準備完整的時間戳記（ISO格式，只到秒數）
    const fullTimestamp = formatTimestamp();
    
    // 準備要添加的數據行（F欄先留空，稍後用公式填入）
    const rowData = [
      fullTimestamp, // A: 時間戳記（完整ISO格式，包含時分秒）
      bookingData.vendor || '未提供', // B: 您的店名
      bookingData.foodType || '未提供', // C: 餐車類型
      getLocationAddress(bookingData.location), // D: 預約場地 - 顯示完整地址
      formatDate(bookingData.date), // E: 預約日期 - 格式化為「10月16日(星期一)」
      '', // F: 己排（稍後用公式填入）
      bookingData.fee || '600', // G: 場地費
      '尚未付款', // H: 款項結清
      '繳交場租，單據上傳官方帳號人工審核' // I: 備註
    ];
    
    console.log('準備添加的數據:', rowData);
    console.log('完整時間戳記:', fullTimestamp);
    
    // 始終插入到最後一行的下一行（不覆蓋現有資料）
    // 確保資料插入到第 10 行之後（跳過標題/說明/示例）
    const lastRow = sheet.getLastRow();
    let targetRow;
    
    if (lastRow < 9) {
      // 工作表結構不完整，插入到第 10 行（第一個資料行）
      targetRow = 10;
      console.log('工作表結構不完整，資料將插入到第 10 行（第一個資料行）');
    } else {
      // 插入到最後一行的下一行（確保在第 10 行之後）
      targetRow = Math.max(lastRow + 1, 10);
      console.log(`工作表最後一行: ${lastRow}，新資料將插入到第 ${targetRow} 行`);
    }
    
    // 插入數據到指定行
    sheet.getRange(targetRow, 1, 1, 9).setValues([rowData]);
    console.log('數據已成功插入到工作表');
    
    // 設定時間戳記欄位（A欄）- 儲存Date物件，用自訂格式顯示
    const timestampCell = sheet.getRange(targetRow, 1);
    timestampCell.setValue(new Date()); // 儲存完整的Date物件（保留精確時間）
    timestampCell.setNumberFormat('yyyy-MM-dd"T"HH:mm:ss'); // 自訂顯示格式（隱藏毫秒和Z）
    
    // 設定 F 欄（己排）的自動判斷公式 - 考慮付款狀態
    // 邏輯：如果H欄是「己繳款」或「已付款」→ 己排班
    //      如果H欄是「尚未付款」且超過24小時 → 逾繳可排
    //      否則 → 己排班
    const statusFormula = `=IF(OR(H${targetRow}="己繳款", H${targetRow}="已付款"), "己排班", IF(AND(H${targetRow}="尚未付款", (NOW()-A${targetRow})*24>24), "逾繳可排", "己排班"))`;
    sheet.getRange(targetRow, 6).setFormula(statusFormula);
    console.log(`F${targetRow} 欄位已設定公式: ${statusFormula}`);
    
    // 設定日期欄位（E欄）為文字格式，防止自動轉換，並置中對齊
    sheet.getRange(targetRow, 5).setNumberFormat('@');
    sheet.getRange(targetRow, 5).setHorizontalAlignment('center');
    
    // 移除自動調整列寬功能，保持原有表格格式
    // sheet.autoResizeColumns(1, 9);
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      const sortLastRow = sheet.getLastRow();
      if (sortLastRow >= 10) {
        // 使用中文日期排序邏輯（只排序第 10 行之後的資料）
        quickSortSheet(sheet);
      }
    } catch (sortError) {
      console.error('排序失敗（不影響新增）:', sortError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '報名記錄已成功添加到Google Sheets',
        data: bookingData,
        rowNumber: targetRow
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('添加記錄到工作表時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法添加記錄到工作表: ' + error.toString(),
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 取消預約並從Google Sheets刪除記錄
function cancelBookingFromSheet(cancelData) {
  try {
    // 記錄接收到的取消數據用於調試
    console.log('接收到的取消數據:', JSON.stringify(cancelData));
    
    // 使用指定的 Google Sheets ID
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    console.log('電子表格名稱:', spreadsheet.getName());
    
    // 獲取名為 "Form_Responses1" 的工作表
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('工作表名稱:', sheet.getName());
    
    // 格式化日期用於比對
    function formatDateForComparison(dateStr) {
      if (!dateStr || dateStr === '未提供') return '未提供';
      
      console.log('原始日期字符串:', dateStr);
      
      let date;
      
      // 處理不同的日期格式
      if (dateStr.includes('-')) {
        // 處理 "2024-10-01" 格式，加上 T00:00:00 避免 UTC 偏移
        date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
      } else if (dateStr.includes('月') && dateStr.includes('日')) {
        // 已經是 "10月1日(星期二)" 格式，直接返回
        console.log('日期已經是正確格式:', dateStr);
        return dateStr;
      } else {
        // 嘗試其他格式
        date = new Date(dateStr);
      }
      
      // 檢查日期是否有效
      if (isNaN(date.getTime())) {
        console.log('無法解析日期:', dateStr);
        return dateStr; // 返回原始字符串
      }
      
      const month = date.getMonth() + 1;
      const day = date.getDate();
      const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const dayName = dayNames[date.getDay()];
      
      const formattedDate = `${month}月${day}日(${dayName})`;
      console.log('格式化後的日期:', formattedDate);
      
      return formattedDate;
    }
    
    // 場地名稱到地址的對應關係（與addBookingToSheet保持一致）
    function getLocationAddress(locationName) {
      const locationMap = {
        '四維路59號': '四維路59號',
        '四維路60號': '四維路60號',
        '漢堡大亨': '四維路70號',
        '自由風': '四維路190號',
        '蔬蒔': '四維路216號',
        '金正好吃': '四維路218號'
      };
      
      return locationMap[locationName] || locationName || '未提供';
    }
    
    // 準備比對數據
    const targetVendor = cancelData.vendor;
    const targetLocation = getLocationAddress(cancelData.location);
    const targetDate = formatDateForComparison(cancelData.date);
    
    console.log('尋找匹配記錄:', { targetVendor, targetLocation, targetDate });
    
    // 獲取所有數據
    const dataRange = sheet.getDataRange();
    const values = dataRange.getValues();
    
    let foundRow = -1;
    
    // 從第2行開始搜尋（跳過標題行）
    for (let i = 1; i < values.length; i++) {
      const row = values[i];
      const vendor = row[1]; // B欄：您的店名
      const location = row[3]; // D欄：預約場地
      const date = row[4]; // E欄：預約日期
      
      console.log(`檢查第${i+1}行: vendor="${vendor}", location="${location}", date="${date}"`);
      console.log(`目標: vendor="${targetVendor}", location="${targetLocation}", date="${targetDate}"`);
      
      // 比對餐車名稱、場地和日期
      if (vendor === targetVendor && 
          location === targetLocation && 
          date === targetDate) {
        foundRow = i + 1; // Google Sheets行號從1開始
        console.log(`找到匹配記錄在第${foundRow}行`);
        break;
      }
    }
    
    if (foundRow === -1) {
      console.log('未找到匹配的預約記錄');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: '未找到匹配的預約記錄',
          searchCriteria: { targetVendor, targetLocation, targetDate }
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 刪除找到的行
    sheet.deleteRow(foundRow);
    console.log(`已刪除第${foundRow}行的預約記錄`);
    
    // 返回成功結果
    const successResult = {
      success: true, 
      message: '預約記錄已成功從Google Sheets刪除',
      deletedRow: foundRow,
      data: cancelData,
      timestamp: formatTimestamp()
    };
    
    console.log('刪除成功，返回結果:', successResult);
    
    return ContentService
      .createTextOutput(JSON.stringify(successResult))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('刪除預約記錄時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法刪除預約記錄: ' + error.toString(),
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getOrCreateSheet(sheetName) {
  const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(sheetName);

  if (!sheet) {
    sheet = spreadsheet.insertSheet(sheetName);
  }

  return sheet;
}

// 測試函數
function testAddBooking() {
  const testData = {
    vendor: '測試餐車',
    location: '四維路59號',
    date: '2025-10-15',
    timeSlot: '14:00-20:00',
    foodType: '中式料理',
    fee: '600',
    timestamp: formatTimestamp()
  };
  
  const result = addBookingToSheet(testData);
  console.log('測試結果:', result.getContent());
  return result;
}

// 測試doPost函數
function testDoPost() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        vendor: '測試餐車2',
        location: '四維路60號',
        date: '2025-10-16',
        timeSlot: '14:00-20:00',
        foodType: '甜點類',
        fee: '600',
        timestamp: formatTimestamp()
      })
    }
  };
  
  const result = doPost(mockEvent);
  console.log('doPost測試結果:', result.getContent());
  return result;
}

// 測試doGet函數
function testDoGet() {
  const mockEvent = {
    parameter: {
      vendor: '測試餐車3',
      location: '四維路59號',
      date: '2025-10-17',
      timeSlot: '14:00-20:00',
      foodType: '中式料理',
      fee: '600',
      timestamp: formatTimestamp()
    }
  };
  
  const result = doGet(mockEvent);
  console.log('doGet測試結果:', result.getContent());
  return result;
}

// 檢查工作表狀態
function checkSheetStatus() {
  try {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    console.log('電子表格名稱:', spreadsheet.getName());
    console.log('電子表格ID:', spreadsheet.getId());
    
    const sheets = spreadsheet.getSheets();
    console.log('工作表列表:');
    sheets.forEach((sheet, index) => {
      console.log(`${index + 1}. ${sheet.getName()} (${sheet.getLastRow()} 行)`);
    });
    
    return {
      spreadsheetName: spreadsheet.getName(),
      spreadsheetId: spreadsheet.getId(),
      sheets: sheets.map(sheet => ({
        name: sheet.getName(),
        lastRow: sheet.getLastRow()
      }))
    };
  } catch (error) {
    console.error('檢查工作表狀態時發生錯誤:', error);
    return { error: error.toString() };
  }
}

// 初始化工作表結構
function initializeSheets() {
  try {
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    console.log('開始初始化工作表結構...');
    
    // 檢查是否已存在 Form_Responses1 工作表
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (sheet) {
      console.log('工作表 Form_Responses1 已存在');
      // 檢查是否已有標題行
      const headerRow = sheet.getRange(7, 1, 1, 9).getValues()[0];
      if (headerRow[0] === '時間戳記') {
        console.log('標題行已存在，無需重新建立');
        return {
          success: true,
          message: '工作表已正確設定',
          sheetExists: true
        };
      }
    } else {
      // 建立新工作表
      sheet = spreadsheet.insertSheet('Form_Responses1');
      console.log('已建立工作表: Form_Responses1');
    }
    
    // 設定工作表結構
    
    // 1. 設定標題區域（第1-6行）
    sheet.getRange(1, 1).setValue('餐車線上報班表系統');
    sheet.getRange(1, 1).setFontSize(18).setFontWeight('bold').setFontColor('#FF4B2B');
    
    sheet.getRange(2, 1).setValue('自動同步數據表');
    sheet.getRange(2, 1).setFontSize(12).setFontColor('#666666');
    
    sheet.getRange(4, 1).setValue('說明：此表格會自動接收來自網頁的報名數據，請勿刪除或重新命名工作表');
    sheet.getRange(4, 1).setFontSize(10).setFontColor('#FF8A00').setFontStyle('italic');
    
    // 2. 設定標題行（第7行）
    const headers = [
      '時間戳記',
      '您的店名', 
      '餐車類型',
      '預約場地',
      '預約日期',
      '己排',
      '場地費',
      '款項結清',
      '備註'
    ];
    
    sheet.getRange(7, 1, 1, 9).setValues([headers]);
    
    // 美化標題行
    const headerRange = sheet.getRange(7, 1, 1, 9);
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(11);
    headerRange.setBackground('#4A90E2');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    headerRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    // 3. 設定欄位說明（第8行）
    const descriptions = [
      '自動記錄',
      '餐車名稱',
      '食物類型',
      '場地地址',
      '報班日期',
      '排班狀態',
      '費用',
      '付款狀態',
      '備註說明'
    ];
    
    sheet.getRange(8, 1, 1, 9).setValues([descriptions]);
    sheet.getRange(8, 1, 1, 9).setFontSize(9).setFontColor('#999999').setFontStyle('italic');
    sheet.getRange(8, 1, 1, 9).setHorizontalAlignment('center');
    
    // 4. 添加示例數據（第9行）
    const today = new Date();
    const exampleDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 7);
    const month = exampleDate.getMonth() + 1;
    const day = exampleDate.getDate();
    const dayNames = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const dayName = dayNames[exampleDate.getDay()];
    
    const exampleData = [
      new Date(),
      '示例餐車（可刪除）',
      '中式料理',
      '四維路59號',
      `${month}月${day}日(${dayName})`,
      '己排班',
      '600',
      '尚未付款',
      '這是示例數據，可以刪除此行'
    ];
    
    sheet.getRange(9, 1, 1, 9).setValues([exampleData]);
    sheet.getRange(9, 1, 1, 9).setBackground('#FFF9E6');
    
    // 5. 設定欄位格式和寬度
    sheet.setColumnWidth(1, 150);  // A: 時間戳記
    sheet.setColumnWidth(2, 120);  // B: 店名
    sheet.setColumnWidth(3, 100);  // C: 餐車類型
    sheet.setColumnWidth(4, 120);  // D: 預約場地
    sheet.setColumnWidth(5, 150);  // E: 預約日期
    sheet.setColumnWidth(6, 80);   // F: 己排
    sheet.setColumnWidth(7, 80);   // G: 場地費
    sheet.setColumnWidth(8, 100);  // H: 款項結清
    sheet.setColumnWidth(9, 250);  // I: 備註
    
    // 6. 設定F欄（己排）的自動公式 - 考慮付款狀態
    // 邏輯：如果H欄是「己繳款」或「已付款」→ 己排班
    //      如果H欄是「尚未付款」且超過24小時 → 逾繳可排
    //      否則 → 己排班
    
    // 手動設定每一行的公式（因為需要動態行號）
    for (let row = 10; row <= 1000; row++) {
      const rowFormula = `=IF(OR(H${row}="己繳款", H${row}="已付款"), "己排班", IF(AND(H${row}="尚未付款", (NOW()-A${row})*24>24), "逾繳可排", "己排班"))`;
      sheet.getRange(`F${row}`).setFormula(rowFormula);
    }
    
    // 7. 設定數據驗證（H欄：款項結清）
    const paymentRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['尚未付款', '已付款', '己繳款', '部分付款'], true)
      .setAllowInvalid(false)
      .setHelpText('請選擇付款狀態')
      .build();
    sheet.getRange('H10:H1000').setDataValidation(paymentRule);
    
    // 7. 凍結標題行
    sheet.setFrozenRows(7);
    
    // 8. 設定條件格式（付款狀態和排班狀態）
    // 已付款 = 綠色
    const paidRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('已付款')
      .setBackground('#D4EDDA')
      .setFontColor('#155724')
      .setRanges([sheet.getRange('H9:H1000')])
      .build();
    
    // 己繳款 = 綠色（與已付款相同效果）
    const paidRule2 = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('己繳款')
      .setBackground('#D4EDDA')
      .setFontColor('#155724')
      .setRanges([sheet.getRange('H9:H1000')])
      .build();
    
    // 尚未付款 = 黃色
    const unpaidRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('尚未付款')
      .setBackground('#FFF3CD')
      .setFontColor('#856404')
      .setRanges([sheet.getRange('H9:H1000')])
      .build();
    
    // 己排班 = 藍色
    const bookedRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('己排班')
      .setBackground('#E3F2FD')
      .setFontColor('#1976D2')
      .setRanges([sheet.getRange('F9:F1000')])
      .build();
    
    // 逾繳可排 = 紅色（緊急）
    const overdueRule = SpreadsheetApp.newConditionalFormatRule()
      .whenTextEqualTo('逾繳可排')
      .setBackground('#FFEBEE')
      .setFontColor('#C62828')
      .setFontWeight('bold')
      .setRanges([sheet.getRange('F9:F1000')])
      .build();
    
    const rules = sheet.getConditionalFormatRules();
    rules.push(paidRule);
    rules.push(paidRule2); // 己繳款
    rules.push(unpaidRule);
    rules.push(bookedRule);
    rules.push(overdueRule);
    sheet.setConditionalFormatRules(rules);
    
    // 9. 保護標題區域（防止誤刪）
    const protection = sheet.getRange('A1:I7').protect();
    protection.setDescription('標題區域受保護，防止誤刪');
    protection.setWarningOnly(true);
    
    console.log('✅ 工作表結構初始化完成！');
    
    return {
      success: true,
      message: '工作表 Form_Responses1 已成功建立並設定完成',
      sheetName: 'Form_Responses1',
      features: [
        '✓ 標題行已設定',
        '✓ 欄位格式已優化',
        '✓ 付款狀態下拉選單',
        '✓ 條件格式（顏色標示）',
        '✓ 標題區域保護',
        '✓ 包含示例數據',
        '✓ 自動逾期檢測公式（F欄）',
        '✓ 逾繳可排狀態顯示'
      ]
    };
    
  } catch (error) {
    console.error('初始化工作表時發生錯誤:', error);
    return {
      success: false,
      message: '初始化失敗: ' + error.toString(),
      error: error.toString()
    };
  }
}

// 解析中文日期格式（例如：12月12日(星期一)）為可排序的數值
function parseChineseDateToNumber(chineseDate) {
  try {
    if (!chineseDate || typeof chineseDate !== 'string') {
      return 0;
    }
    
    // 提取月份和日期（例如：從 "12月12日(星期一)" 提取 12 和 12）
    const match = chineseDate.match(/(\d{1,2})月(\d{1,2})日/);
    if (!match) {
      return 0;
    }
    
    const month = parseInt(match[1], 10);
    const day = parseInt(match[2], 10);
    
    // 轉換為可排序的數字：月份*100 + 日期
    // 例如：12月12日 = 1212，1月5日 = 105
    return month * 100 + day;
  } catch (error) {
    console.error('解析中文日期失敗:', error, chineseDate);
    return 0;
  }
}

// 快速排序工作表（使用中文日期排序邏輯）
function quickSortSheet(sheet) {
  try {
    const lastRow = sheet.getLastRow();
    if (lastRow < 10) {
      return; // 沒有資料需要排序
    }
    
    // 讀取所有資料（從第10行開始，跳過標題/說明/示例）
    const dataRange = sheet.getRange(10, 1, lastRow - 9, 9);
    const values = dataRange.getValues();
    
    // 為每一行資料添加索引和日期數值
    const dataWithIndex = values.map((row, index) => {
      const actualRowNumber = index + 10; // 實際行號（從第10行開始）
      const chineseDate = row[4]; // E欄（索引4）是預約日期
      const dateNumber = parseChineseDateToNumber(chineseDate);
      return {
        row: row,
        originalIndex: index,
        originalRowNumber: actualRowNumber,
        dateNumber: dateNumber
      };
    });
    
    // 按照日期數值排序（遞增）
    dataWithIndex.sort((a, b) => {
      if (a.dateNumber !== b.dateNumber) {
        return a.dateNumber - b.dateNumber;
      }
      return a.originalIndex - b.originalIndex;
    });
    
    // 提取排序後的資料並寫回工作表（寫回第10行開始）
    const sortedData = dataWithIndex.map(item => item.row);
    sheet.getRange(10, 1, sortedData.length, 9).setValues(sortedData);

    // 重新設定 F 欄公式（排序後 getValues 會把公式變成純值）
    for (let i = 0; i < sortedData.length; i++) {
      const row = i + 10;
      const statusFormula = `=IF(OR(H${row}="己繳款", H${row}="已付款"), "己排班", IF(AND(H${row}="尚未付款", (NOW()-A${row})*24>24), "逾繳可排", "己排班"))`;
      sheet.getRange(row, 6).setFormula(statusFormula);
    }

    console.log(`✅ 已按照預約日期遞增排序（${sortedData.length} 行），F欄公式已重建`);

  } catch (error) {
    console.error('快速排序失敗:', error);
  }
}

// 排序工作表數據（按照預約日期遞增，支援中文日期格式）
function sortSheetByDate() {
  try {
    console.log('========== 開始排序工作表（中文日期格式）==========');
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.log('找不到工作表');
      return {
        success: false,
        message: '找不到工作表 Form_Responses1'
      };
    }
    
    const lastRow = sheet.getLastRow();
    console.log(`工作表最後一行: ${lastRow}`);
    
    if (lastRow < 10) {
      console.log('沒有資料需要排序');
      return {
        success: true,
        message: '沒有資料需要排序',
        sortedRows: 0
      };
    }
    
    // 讀取所有資料（從第10行開始，跳過標題/說明/示例）
    const dataRange = sheet.getRange(10, 1, lastRow - 9, 9);
    const values = dataRange.getValues();
    
    console.log(`讀取了 ${values.length} 行資料`);
    
    // 為每一行資料添加索引、日期數值
    const dataWithIndex = values.map((row, index) => {
      const actualRowNumber = index + 10; // 實際行號（從第10行開始）
      const chineseDate = row[4]; // E欄（索引4）是預約日期
      const dateNumber = parseChineseDateToNumber(chineseDate);
      return {
        row: row,
        originalIndex: index,
        originalRowNumber: actualRowNumber,
        dateNumber: dateNumber,
        chineseDate: chineseDate
      };
    });
    
    // 按照日期數值排序（遞增）
    dataWithIndex.sort((a, b) => {
      if (a.dateNumber !== b.dateNumber) {
        return a.dateNumber - b.dateNumber;
      }
      // 如果日期相同，保持原有順序
      return a.originalIndex - b.originalIndex;
    });
    
    // 提取排序後的資料
    const sortedData = dataWithIndex.map(item => item.row);
    
    // 寫回工作表（寫回第10行開始）
    sheet.getRange(10, 1, sortedData.length, 9).setValues(sortedData);

    // 重新設定 F 欄公式（排序後 getValues 會把公式變成純值）
    for (let i = 0; i < sortedData.length; i++) {
      const row = i + 10;
      const statusFormula = `=IF(OR(H${row}="己繳款", H${row}="已付款"), "己排班", IF(AND(H${row}="尚未付款", (NOW()-A${row})*24>24), "逾繳可排", "己排班"))`;
      sheet.getRange(row, 6).setFormula(statusFormula);
    }

    const sortedCount = sortedData.length;
    console.log(`✅ 已排序 ${sortedCount} 行資料（按照預約日期遞增）`);
    
    // 顯示前5筆排序結果供確認
    if (sortedData.length > 0) {
      console.log('排序後前5筆資料：');
      for (let i = 0; i < Math.min(5, sortedData.length); i++) {
        const item = dataWithIndex[i];
        console.log(`  ${i+1}. ${item.chineseDate} (數值: ${item.dateNumber})`);
      }
    }
    
    console.log('===================================');
    
    return {
      success: true,
      message: `成功排序 ${sortedCount} 行資料`,
      sortedRows: sortedCount,
      sortColumn: 'E欄（預約日期）',
      sortOrder: '遞增',
      dateFormat: '中文日期格式（12月12日）'
    };
    
  } catch (error) {
    console.error('排序失敗:', error);
    return {
      success: false,
      message: '排序失敗: ' + error.toString(),
      error: error.toString()
    };
  }
}

// 獲取所有預約數據
function getAllBookings() {
  try {
    console.log('開始獲取所有預約數據...');
    
    // 使用指定的 Google Sheets ID
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 獲取名為 "Form_Responses1" 的工作表
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    if (!sheet) {
      console.log('找不到工作表 Form_Responses1');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: '找不到工作表 Form_Responses1',
          bookings: []
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    console.log('工作表名稱:', sheet.getName());
    
    // ⚡ 已移除每次讀取前的自動排序以提升性能（僅在新增/更新時排序）
    
    // 獲取所有數據（從第10行開始，跳過標題/說明/示例）
    const lastRow = sheet.getLastRow();
    if (lastRow < 10) {
      console.log('沒有數據行');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '沒有預約記錄',
          bookings: [],
          lastUpdate: formatTimestamp()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getRange(10, 1, lastRow - 9, 9); // 從第10行開始，讀取9列
    const values = dataRange.getValues();
    
    console.log(`========== 讀取 Google Sheets ==========`);
    console.log(`總行數: ${lastRow}, 數據從第10行開始`);
    console.log(`讀取了 ${values.length} 行數據`);
    
    // 轉換為JSON格式
    const bookings = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const actualRow = i + 10; // 實際行號（從第10行開始）
      
      // ⚡ v3.2.3 性能優化：移除逐行日誌以提升載入速度
      // 跳過空行（B欄店名為空）
      if (!row[1] || row[1] === '') {
        continue;
      }
      
      // 處理時間戳記（確保是乾淨的ISO格式）
      let timestamp = '';
      if (row[0]) {
        if (row[0] instanceof Date) {
          timestamp = formatTimestamp(row[0]);
        } else {
          timestamp = row[0].toString();
        }
      }
      
      const booking = {
        timestamp: timestamp,            // A: 時間戳記（完整ISO格式）
        vendor: row[1] || '',            // B: 您的店名
        foodType: row[2] || '',          // C: 餐車類型
        location: row[3] || '',          // D: 預約場地
        date: row[4] || '',              // E: 預約日期
        status: row[5] || '',            // F: 己排
        bookedStatus: row[5] || '',      // F: 己排狀態（包含公式結果）
        fee: row[6] || '',               // G: 場地費
        payment: row[7] || '',           // H: 款項結清
        note: row[8] || '',              // I: 備註
        rowNumber: actualRow             // 記錄在第幾行，方便後續更新（使用actualRow變數）
      };
      
      // 日誌：顯示時間戳記和付款狀態以便診斷
      if (i < 3) { // 只顯示前3筆以避免日誌過多
        console.log(`預約 #${i+1}: ${booking.vendor}, 時間戳記: ${timestamp}`);
        console.log(`  → H欄(款項結清): "${booking.payment}", F欄(己排): "${booking.bookedStatus}"`);
      }
      
      bookings.push(booking);
    }
    
    console.log(`成功轉換 ${bookings.length} 條預約記錄`);
    
    // 返回結果
    const result = {
      success: true,
      message: `成功獲取 ${bookings.length} 條預約記錄`,
      bookings: bookings,
      lastUpdate: formatTimestamp(),
      totalCount: bookings.length
    };
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('獲取預約數據時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法獲取預約數據: ' + error.toString(),
        error: error.toString(),
        bookings: []
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新預約狀態（例如付款狀態）
function updateBookingStatus(data) {
  try {
    console.log('開始更新預約狀態:', JSON.stringify(data));
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: false, 
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 如果提供了行號，直接更新該行
    if (data.rowNumber && data.rowNumber >= 8) {
      if (data.payment) {
        sheet.getRange(data.rowNumber, 8).setValue(data.payment); // H欄：款項結清
      }
      if (data.note) {
        sheet.getRange(data.rowNumber, 9).setValue(data.note); // I欄：備註
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '預約狀態已更新',
          rowNumber: data.rowNumber
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // 否則根據條件查找行
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '請提供行號以更新狀態'
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('更新預約狀態時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法更新預約狀態: ' + error.toString(),
        error: error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 獲取已預約的日期（用於前端過濾）
function getBookedDates() {
  try {
    console.log('開始獲取已預約日期...');
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.log('找不到工作表 Form_Responses1');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '沒有預約記錄',
          bookedDates: {},
          lastUpdate: formatTimestamp()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 10) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '沒有預約記錄',
          bookedDates: {},
          lastUpdate: formatTimestamp()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // ⚡ 已移除每次讀取前的自動排序以提升性能（僅在新增/更新時排序）
    
    const dataRange = sheet.getRange(10, 1, lastRow - 9, 9);
    const values = dataRange.getValues();
    
    // 按場地整理已預約的日期
    const bookedDates = {};
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      
      // 跳過空行
      if (!row[1] || row[1] === '') continue;
      
      const location = row[3] || ''; // D欄：預約場地
      const date = row[4] || '';      // E欄：預約日期
      
      if (location && date) {
        if (!bookedDates[location]) {
          bookedDates[location] = [];
        }
        
        // 將日期格式化為標準格式以便前端比對
        // 例如：10月16日(星期四) -> 2025-10-16
        const dateMatch = date.match(/(\d+)月(\d+)日/);
        if (dateMatch) {
          const month = parseInt(dateMatch[1]);
          const day = parseInt(dateMatch[2]);
          
          // 根據時間戳記判斷年份：時間戳記 + 3 個月內的日期
          let year;
          if (row[0]) {
            const timestampDate = row[0] instanceof Date ? row[0] : new Date(row[0]);
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
          
          const standardDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          bookedDates[location].push({
            originalDate: date,
            standardDate: standardDate,
            vendor: row[1] || ''
          });
        }
      }
    }
    
    console.log('已預約日期整理完成');
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: `成功獲取已預約日期`,
        bookedDates: bookedDates,
        lastUpdate: formatTimestamp()
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('獲取已預約日期時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法獲取已預約日期: ' + error.toString(),
        error: error.toString(),
        bookedDates: {}
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 接手逾期預約函數
function takeoverBooking(takeoverData) {
  try {
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let rowNumber = takeoverData.rowNumber;
    
    // 如果沒有提供行號，通過場地和日期查找
    if (!rowNumber || rowNumber < 8) {
      console.log('未提供行號，開始搜尋匹配的預約...');
      const data = sheet.getDataRange().getValues();
      const targetLocation = takeoverData.location;
      const targetDate = formatDateForSheet(takeoverData.date);
      
      for (let i = 1; i < data.length; i++) { // 從第2行開始（索引1）
        const row = data[i];
        const location = row[3]; // D欄：預約場地
        const date = row[4];     // E欄：預約日期
        
        console.log(`檢查第${i+1}行: 場地=${location}, 日期=${date}`);
        
        if (location === targetLocation && date === targetDate) {
          rowNumber = i + 1; // Google Sheets行號從1開始
          console.log(`找到匹配預約在第${rowNumber}行`);
          break;
        }
      }
      
      if (!rowNumber || rowNumber < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 更新該行的預約資訊
    const newTimestamp = formatTimestamp();
    const formattedDate = formatDateForSheet(takeoverData.date);
    
    console.log(`準備更新第${rowNumber}行: 新餐車=${takeoverData.vendor}, 原餐車=${takeoverData.originalVendor}`);
    
    // 先讀取原有的付款狀態，保持已付款的狀態
    const currentPaymentStatus = sheet.getRange(rowNumber, 8).getValue(); // H欄：款項結清
    const isPaid = currentPaymentStatus === '己繳款' || currentPaymentStatus === '已付款';
    const preservedPaymentStatus = isPaid ? currentPaymentStatus : '尚未付款';
    
    console.log(`原有付款狀態: ${currentPaymentStatus}, 是否已付款: ${isPaid}, 保持狀態: ${preservedPaymentStatus}`);
    
    // 更新行數據
    const timestampCell = sheet.getRange(rowNumber, 1);
    timestampCell.setValue(new Date()); // A: 時間戳記（Date物件）
    timestampCell.setNumberFormat('yyyy-MM-dd"T"HH:mm:ss'); // 自訂顯示格式
    
    sheet.getRange(rowNumber, 2).setValue(takeoverData.vendor); // B: 店名
    sheet.getRange(rowNumber, 3).setValue(takeoverData.foodType); // C: 餐車類型
    sheet.getRange(rowNumber, 4).setValue(takeoverData.location); // D: 預約場地
    sheet.getRange(rowNumber, 5).setValue(formattedDate); // E: 預約日期
    
    // F: 己排 - 使用公式自動判斷（考慮付款狀態）
    const statusFormula = `=IF(OR(H${rowNumber}="己繳款", H${rowNumber}="已付款"), "己排班", IF(AND(H${rowNumber}="尚未付款", (NOW()-A${rowNumber})*24>24), "逾繳可排", "己排班"))`;
    sheet.getRange(rowNumber, 6).setFormula(statusFormula);
    console.log(`F${rowNumber} 欄位已設定公式: ${statusFormula}`);
    
    sheet.getRange(rowNumber, 7).setValue(takeoverData.fee); // G: 場地費
    sheet.getRange(rowNumber, 8).setValue(preservedPaymentStatus); // H: 款項結清（保持原有付款狀態）
    sheet.getRange(rowNumber, 9).setValue(`接手自: ${takeoverData.originalVendor}`); // I: 備註
    
    console.log(`✅ 成功接手預約 - 行號: ${rowNumber}, 新餐車: ${takeoverData.vendor}, 時間戳記: ${newTimestamp}`);
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      quickSortSheet(sheet);
    } catch (sortError) {
      console.error('排序失敗（不影響接手）:', sortError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: `成功接手預約`,
        rowNumber: rowNumber,
        newVendor: takeoverData.vendor,
        originalVendor: takeoverData.originalVendor
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('接手預約失敗:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '接手預約失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 排班釋出函數（已付款的班轉讓給其他餐車）
function transferBooking(transferData) {
  try {
    console.log('========== transferBooking 開始 ==========');
    console.log('收到的釋出數據:', JSON.stringify(transferData));
    console.log('action:', transferData.action);
    console.log('rowNumber:', transferData.rowNumber);
    console.log('originalVendor:', transferData.originalVendor);
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.error('找不到工作表');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let rowNumber = transferData.rowNumber;
    console.log('收到的行號:', rowNumber, '類型:', typeof rowNumber);
    
    // 如果沒有提供行號，通過場地、日期和店名查找
    if (!rowNumber || rowNumber < 2) {
      console.log('未提供行號，開始搜尋匹配的預約...');
      const data = sheet.getDataRange().getValues();
      const targetLocation = transferData.location;
      const targetDate = formatDateForSheet(transferData.date);
      const targetVendor = transferData.originalVendor;
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const vendor = row[1];   // B欄：店名
        const location = row[3]; // D欄：預約場地
        const date = row[4];     // E欄：預約日期
        
        console.log(`檢查第${i+1}行: 店名=${vendor}, 場地=${location}, 日期=${date}`);
        
        if (vendor === targetVendor && location === targetLocation && date === targetDate) {
          rowNumber = i + 1;
          console.log(`找到匹配預約在第${rowNumber}行`);
          break;
        }
      }
      
      if (!rowNumber || rowNumber < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 只更新 B欄（店名）、C欄（餐車類型）、I欄（備註）
    console.log(`準備釋出第${rowNumber}行: 原餐車=${transferData.originalVendor}, 新餐車=${transferData.vendor}`);
    
    sheet.getRange(rowNumber, 2).setValue(transferData.vendor); // B: 新店名
    sheet.getRange(rowNumber, 3).setValue(transferData.foodType); // C: 新餐車類型
    sheet.getRange(rowNumber, 9).setValue(`轉出自: ${transferData.originalVendor}`); // I: 備註
    
    console.log(`✅ 成功釋出排班 - 行號: ${rowNumber}, 原餐車: ${transferData.originalVendor}, 新餐車: ${transferData.vendor}`);
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      quickSortSheet(sheet);
    } catch (sortError) {
      console.error('排序失敗（不影響釋出）:', sortError);
    }
    
    console.log('===================================');
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '成功釋出排班',
        rowNumber: rowNumber,
        originalVendor: transferData.originalVendor,
        newVendor: transferData.vendor
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('釋出排班失敗:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '釋出排班失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 刪除預約函數
function deleteBooking(deleteData) {
  try {
    console.log('========== deleteBooking 開始 ==========');
    console.log('收到的刪除數據:', JSON.stringify(deleteData));
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.error('找不到工作表');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let rowNumber = deleteData.rowNumber;
    console.log('提供的行號:', rowNumber);
    
    // 如果沒有提供行號，通過場地、日期和店名查找
    if (!rowNumber || rowNumber < 8) {
      console.log('未提供行號，開始搜尋匹配的預約...');
      const data = sheet.getDataRange().getValues();
      const targetLocation = deleteData.location;
      const targetDate = formatDateForSheet(deleteData.date);
      const targetVendor = deleteData.vendor;
      
      for (let i = 1; i < data.length; i++) { // 從第2行開始
        const row = data[i];
        const vendor = row[1];   // B欄：店名
        const location = row[3]; // D欄：預約場地
        const date = row[4];     // E欄：預約日期
        
        console.log(`檢查第${i+1}行: 店名=${vendor}, 場地=${location}, 日期=${date}`);
        
        if (vendor === targetVendor && location === targetLocation && date === targetDate) {
          rowNumber = i + 1;
          console.log(`找到匹配預約在第${rowNumber}行`);
          break;
        }
      }
      
      if (!rowNumber || rowNumber < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 刪除該行
    console.log(`準備刪除第${rowNumber}行`);
    console.log(`刪除前工作表行數: ${sheet.getLastRow()}`);
    
    sheet.deleteRow(rowNumber);
    
    console.log(`刪除後工作表行數: ${sheet.getLastRow()}`);
    console.log(`✅ 成功刪除第${rowNumber}行的預約`);
    console.log('===================================');
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      quickSortSheet(sheet);
    } catch (sortError) {
      console.error('排序失敗（不影響刪除）:', sortError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '成功刪除預約',
        deletedRow: rowNumber,
        vendor: deleteData.vendor,
        location: deleteData.location,
        date: deleteData.date
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('刪除預約失敗:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '刪除預約失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新付款狀態函數（用於審計）
function updatePaymentStatus(updateData) {
  try {
    console.log('========== updatePaymentStatus 開始 ==========');
    console.log('收到的更新數據:', JSON.stringify(updateData));
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.error('找不到工作表');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let rowNumber = updateData.rowNumber;
    console.log('提供的行號:', rowNumber, '類型:', typeof rowNumber);
    
    // 如果沒有提供行號，通過場地、日期和店名查找
    if (!rowNumber || rowNumber < 2) {
      console.log('未提供行號，開始搜尋匹配的預約...');
      const data = sheet.getDataRange().getValues();
      const targetLocation = updateData.location;
      const targetDate = formatDateForSheet(updateData.date);
      const targetVendor = updateData.vendor;
      
      for (let i = 1; i < data.length; i++) { // 從第2行開始
        const row = data[i];
        const vendor = row[1];   // B欄：店名
        const location = row[3]; // D欄：預約場地
        const date = row[4];     // E欄：預約日期
        
        console.log(`檢查第${i+1}行: 店名=${vendor}, 場地=${location}, 日期=${date}`);
        
        if (vendor === targetVendor && location === targetLocation && date === targetDate) {
          rowNumber = i + 1;
          console.log(`找到匹配預約在第${rowNumber}行`);
          break;
        }
      }
      
      if (!rowNumber || rowNumber < 2) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 更新 H 欄（款項結清）為「己繳款」
    console.log(`準備更新第${rowNumber}行的付款狀態為: ${updateData.payment}`);
    sheet.getRange(rowNumber, 8).setValue(updateData.payment); // H欄：款項結清
    
    // 更新 I 欄備註
    const currentNote = sheet.getRange(rowNumber, 9).getValue();
    const newNote = currentNote ? `${currentNote} | 審計確認` : '審計確認';
    sheet.getRange(rowNumber, 9).setValue(newNote);
    
    console.log(`✅ 成功更新第${rowNumber}行的付款狀態`);
    console.log('===================================');
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      quickSortSheet(sheet);
    } catch (sortError) {
      console.error('排序失敗（不影響更新）:', sortError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '成功更新付款狀態',
        rowNumber: rowNumber,
        vendor: updateData.vendor,
        location: updateData.location,
        date: updateData.date,
        payment: updateData.payment
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('更新付款狀態失敗:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '更新付款狀態失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 更新預約函數（後台管理用）
function updateBooking(updateData) {
  try {
    console.log('========== updateBooking 開始 ==========');
    console.log('收到的更新數據:', JSON.stringify(updateData));
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.error('找不到工作表');
      return ContentService
        .createTextOutput(JSON.stringify({
          success: false,
          message: '找不到工作表 Form_Responses1'
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    let rowNumber = updateData.rowNumber;
    console.log('提供的行號:', rowNumber, '類型:', typeof rowNumber);
    
    // 如果沒有提供行號，通過場地、日期和店名查找
    if (!rowNumber || rowNumber < 10) {
      console.log('未提供行號，開始搜尋匹配的預約...');
      const data = sheet.getDataRange().getValues();
      const targetLocation = updateData.location;
      const targetDate = formatDateForSheet(updateData.date);
      const targetVendor = updateData.vendor;
      
      for (let i = 9; i < data.length; i++) { // 從第10行開始（數據從第10行開始）
        const row = data[i];
        const vendor = row[1];   // B欄：店名
        const location = row[3]; // D欄：預約場地
        const date = row[4];     // E欄：預約日期
        
        if (vendor === targetVendor && location === targetLocation && date === targetDate) {
          rowNumber = i + 1;
          console.log(`找到匹配預約在第${rowNumber}行`);
          break;
        }
      }
      
      if (!rowNumber || rowNumber < 10) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 更新各個欄位（如果提供了新值）
    if (updateData.vendor !== undefined) {
      sheet.getRange(rowNumber, 2).setValue(updateData.vendor); // B欄：店名
    }
    if (updateData.foodType !== undefined) {
      sheet.getRange(rowNumber, 3).setValue(updateData.foodType); // C欄：餐車類型
    }
    if (updateData.location !== undefined) {
      sheet.getRange(rowNumber, 4).setValue(updateData.location); // D欄：預約場地
    }
    if (updateData.date !== undefined) {
      const formattedDate = formatDateForSheet(updateData.date);
      sheet.getRange(rowNumber, 5).setValue(formattedDate); // E欄：預約日期
    }
    if (updateData.status !== undefined) {
      sheet.getRange(rowNumber, 6).setValue(updateData.status); // F欄：己排
    }
    if (updateData.fee !== undefined) {
      sheet.getRange(rowNumber, 7).setValue(updateData.fee); // G欄：場地費
    }
    if (updateData.payment !== undefined) {
      sheet.getRange(rowNumber, 8).setValue(updateData.payment); // H欄：款項結清
    }
    if (updateData.note !== undefined) {
      sheet.getRange(rowNumber, 9).setValue(updateData.note); // I欄：備註
    }
    
    console.log(`✅ 成功更新第${rowNumber}行的預約資料`);
    console.log('===================================');
    
    // 自動排序：按照預約日期（E欄）遞增排序
    try {
      quickSortSheet(sheet);
    } catch (sortError) {
      console.error('排序失敗（不影響更新）:', sortError);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: '成功更新預約',
        rowNumber: rowNumber,
        vendor: updateData.vendor,
        location: updateData.location,
        date: updateData.date
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('更新預約失敗:', error);
    return ContentService
      .createTextOutput(JSON.stringify({
        success: false,
        message: '更新預約失敗: ' + error.toString()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ========== 場地費用結算功能 ==========

// 創建或更新場地費用結算表
function createOrUpdateLocationFeeSheet() {
  try {
    console.log('========== 開始創建/更新場地費用結算表 ==========');
    
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // 獲取 Form_Responses1 工作表
    const sourceSheet = spreadsheet.getSheetByName('Form_Responses1');
    if (!sourceSheet) {
      throw new Error('找不到 Form_Responses1 工作表');
    }
    
    // 創建或獲取"場地費用結算表"工作表
    let feeSheet = spreadsheet.getSheetByName('場地費用結算表');
    if (!feeSheet) {
      feeSheet = spreadsheet.insertSheet('場地費用結算表');
      console.log('已創建新工作表：場地費用結算表');
    } else {
      // 清空現有數據
      feeSheet.clear();
      console.log('已清空現有數據');
    }
    
    // 設置標題
    const headers = [
      '月份',
      '場地名稱',
      '總報班數',
      '已付款數',
      '未付款數',
      '總費用',
      '已收費用',
      '未收費用',
      '應付場地方',
      '已付場地方',
      '待付場地方',
      '淨利',
      '功夫茶員工分潤',
      '付款率'
    ];
    
    feeSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    
    // 美化標題行
    const headerRange = feeSheet.getRange(1, 1, 1, headers.length);
    headerRange.setFontWeight('bold');
    headerRange.setFontSize(12);
    headerRange.setBackground('#4A90E2');
    headerRange.setFontColor('#FFFFFF');
    headerRange.setHorizontalAlignment('center');
    headerRange.setVerticalAlignment('middle');
    headerRange.setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
    
    // 讀取 Form_Responses1 的數據
    const lastRow = sourceSheet.getLastRow();
    if (lastRow < 2) {
      console.log('沒有數據可統計');
      
      // 添加說明
      feeSheet.getRange(2, 1).setValue('目前沒有報班記錄可以統計');
      feeSheet.getRange(2, 1).setFontStyle('italic').setFontColor('#999999');
      
      return {
        success: true,
        message: '沒有數據可統計',
        locationCount: 0
      };
    }
    
    const dataRange = sourceSheet.getRange(2, 1, lastRow - 1, 9);
    const values = dataRange.getValues();
    
    console.log(`讀取了 ${values.length} 行數據`);
    
    // 按月份+場地統計數據
    const locationStats = {};
    
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      const vendor = row[1];    // B: 店名
      const location = row[3];  // D: 場地
      const dateStr = row[4];   // E: 預約日期（例如：10月16日(星期四)）
      const feeStr = row[6];    // G: 場地費
      const payment = row[7];   // H: 付款狀態
      
      // 跳過空行
      if (!vendor || vendor === '' || vendor === '示例餐車（可刪除）') continue;
      
      // 解析月份（從日期字串提取）
      let month = '';
      const monthMatch = dateStr ? String(dateStr).match(/(\d+)月/) : null;
      if (monthMatch) {
        month = monthMatch[1] + '月';
      } else {
        month = '未知月份';
      }
      
      // 解析費用（處理可能的逗號分隔符）
      const fee = parseFloat(String(feeStr).replace(/,/g, '')) || 0;
      
      // 建立組合鍵：月份-場地
      const key = `${month}-${location}`;
      
      // 初始化統計
      if (!locationStats[key]) {
        locationStats[key] = {
          month: month,
          location: location,
          totalCount: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalFee: 0,
          paidFee: 0,
          unpaidFee: 0
        };
      }
      
      // 累計統計
      locationStats[key].totalCount++;
      locationStats[key].totalFee += fee;
      
      // 判斷付款狀態
      if (payment === '已付款' || payment === '己繳款') {
        locationStats[key].paidCount++;
        locationStats[key].paidFee += fee;
      } else {
        locationStats[key].unpaidCount++;
        locationStats[key].unpaidFee += fee;
      }
      
      console.log(`處理第${i+1}行: 月份=${month}, 場地=${location}, 費用=${fee}, 付款=${payment}`);
    }
    
    // 將統計結果寫入工作表
    const resultData = [];
    for (const key in locationStats) {
      const stats = locationStats[key];
      const paymentRate = stats.totalCount > 0 
        ? (stats.paidCount / stats.totalCount * 100).toFixed(1) + '%'
        : '0%';
      
      // 計算場地方費用（一半）
      const locationFeeTotal = stats.totalFee / 2;      // 應付場地方總額
      const locationFeePaid = stats.paidFee / 2;        // 已付場地方
      const locationFeeUnpaid = stats.unpaidFee / 2;    // 待付場地方
      
      // 計算淨利和員工分潤
      const netProfit = stats.paidFee - locationFeePaid;  // 淨利 = 已收費用 - 已付場地方
      const employeeShare = netProfit / 3;                 // 功夫茶員工分潤 = 淨利 × 1/3
      
      resultData.push([
        stats.month,
        stats.location,
        stats.totalCount,
        stats.paidCount,
        stats.unpaidCount,
        stats.totalFee,
        stats.paidFee,
        stats.unpaidFee,
        locationFeeTotal,
        locationFeePaid,
        locationFeeUnpaid,
        netProfit,
        employeeShare,
        paymentRate
      ]);
    }
    
    // 先按月份數字排序，再按總報班數降序排序
    resultData.sort((a, b) => {
      // 提取月份數字
      const monthA = parseInt(a[0].replace('月', '')) || 0;
      const monthB = parseInt(b[0].replace('月', '')) || 0;
      
      // 先按月份升序
      if (monthA !== monthB) {
        return monthA - monthB;
      }
      // 同月份則按總報班數降序
      return b[2] - a[2];
    });
    
    console.log(`統計了 ${resultData.length} 個場地`);
    
    // 按月份分組，並在每個月份後插入小計行
    const finalData = [];
    let currentMonth = '';
    let monthlyTotals = {
      totalCount: 0,
      paidCount: 0,
      unpaidCount: 0,
      totalFee: 0,
      paidFee: 0,
      unpaidFee: 0,
      locationFeeTotal: 0,
      locationFeePaid: 0,
      locationFeeUnpaid: 0,
      netProfit: 0,
      employeeShare: 0
    };
    
    for (let i = 0; i < resultData.length; i++) {
      const row = resultData[i];
      const month = row[0];
      
      // 如果遇到新月份，先插入前一個月的小計
      if (currentMonth !== '' && currentMonth !== month) {
        const paymentRate = monthlyTotals.totalCount > 0 
          ? (monthlyTotals.paidCount / monthlyTotals.totalCount * 100).toFixed(1) + '%'
          : '0%';
        
        finalData.push([
          `${currentMonth}小計`,
          '',
          monthlyTotals.totalCount,
          monthlyTotals.paidCount,
          monthlyTotals.unpaidCount,
          monthlyTotals.totalFee,
          monthlyTotals.paidFee,
          monthlyTotals.unpaidFee,
          monthlyTotals.locationFeeTotal,
          monthlyTotals.locationFeePaid,
          monthlyTotals.locationFeeUnpaid,
          monthlyTotals.netProfit,
          monthlyTotals.employeeShare,
          paymentRate
        ]);
        
        // 重置月度統計
        monthlyTotals = {
          totalCount: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalFee: 0,
          paidFee: 0,
          unpaidFee: 0,
          locationFeeTotal: 0,
          locationFeePaid: 0,
          locationFeeUnpaid: 0,
          netProfit: 0,
          employeeShare: 0
        };
      }
      
      // 更新當前月份
      currentMonth = month;
      
      // 添加當前行
      finalData.push(row);
      
      // 累計月度統計
      monthlyTotals.totalCount += row[2];
      monthlyTotals.paidCount += row[3];
      monthlyTotals.unpaidCount += row[4];
      monthlyTotals.totalFee += row[5];
      monthlyTotals.paidFee += row[6];
      monthlyTotals.unpaidFee += row[7];
      monthlyTotals.locationFeeTotal += row[8];
      monthlyTotals.locationFeePaid += row[9];
      monthlyTotals.locationFeeUnpaid += row[10];
      monthlyTotals.netProfit += row[11];
      monthlyTotals.employeeShare += row[12];
    }
    
    // 插入最後一個月的小計
    if (currentMonth !== '') {
      const paymentRate = monthlyTotals.totalCount > 0 
        ? (monthlyTotals.paidCount / monthlyTotals.totalCount * 100).toFixed(1) + '%'
        : '0%';
      
      finalData.push([
        `${currentMonth}小計`,
        '',
        monthlyTotals.totalCount,
        monthlyTotals.paidCount,
        monthlyTotals.unpaidCount,
        monthlyTotals.totalFee,
        monthlyTotals.paidFee,
        monthlyTotals.unpaidFee,
        monthlyTotals.locationFeeTotal,
        monthlyTotals.locationFeePaid,
        monthlyTotals.locationFeeUnpaid,
        monthlyTotals.netProfit,
        monthlyTotals.employeeShare,
        paymentRate
      ]);
    }
    
    console.log(`處理後共有 ${finalData.length} 行數據（包含月度小計）`);
    
    // 寫入數據
    if (finalData.length > 0) {
      feeSheet.getRange(2, 1, finalData.length, headers.length).setValues(finalData);
      
      // 設置數字格式（應用到所有數據行）
      feeSheet.getRange(2, 3, finalData.length, 3).setNumberFormat('#,##0');  // 數量
      feeSheet.getRange(2, 6, finalData.length, 8).setNumberFormat('#,##0');  // 費用（包含場地方費用、淨利、員工分潤）
      
      // 設置列寬
      feeSheet.setColumnWidth(1, 80);   // 月份
      feeSheet.setColumnWidth(2, 150);  // 場地名稱
      feeSheet.setColumnWidth(3, 90);   // 總報班數
      feeSheet.setColumnWidth(4, 90);   // 已付款數
      feeSheet.setColumnWidth(5, 90);   // 未付款數
      feeSheet.setColumnWidth(6, 100);  // 總費用
      feeSheet.setColumnWidth(7, 100);  // 已收費用
      feeSheet.setColumnWidth(8, 100);  // 未收費用
      feeSheet.setColumnWidth(9, 110);  // 應付場地方
      feeSheet.setColumnWidth(10, 110); // 已付場地方
      feeSheet.setColumnWidth(11, 110); // 待付場地方
      feeSheet.setColumnWidth(12, 110); // 淨利
      feeSheet.setColumnWidth(13, 130); // 功夫茶員工分潤
      feeSheet.setColumnWidth(14, 90);  // 付款率
      
      // 添加資料格式和對齊
      const dataRange2 = feeSheet.getRange(2, 1, finalData.length, headers.length);
      dataRange2.setVerticalAlignment('middle');
      dataRange2.setBorder(true, true, true, true, true, true, '#CCCCCC', SpreadsheetApp.BorderStyle.SOLID);
      
      // 美化月度小計行
      for (let i = 0; i < finalData.length; i++) {
        const rowData = finalData[i];
        const monthValue = rowData[0];
        
        // 檢查是否為小計行
        if (String(monthValue).includes('小計')) {
          const rowNum = i + 2; // +2 因為標題行是第1行，數據從第2行開始
          const subtotalRange = feeSheet.getRange(rowNum, 1, 1, headers.length);
          subtotalRange.setFontWeight('bold');
          subtotalRange.setBackground('#FFF4E6');
          subtotalRange.setFontColor('#D35400');
          subtotalRange.setBorder(true, true, true, true, false, false, '#D35400', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
        }
      }
      
      // 設置條件格式（付款率顏色標示）
      // 付款率 >= 80% = 綠色
      const highPaymentRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberGreaterThanOrEqualTo(0.8)
        .setBackground('#D4EDDA')
        .setFontColor('#155724')
        .setRanges([feeSheet.getRange(2, 14, finalData.length, 1)])
        .build();
      
      // 付款率 50-79% = 黃色
      const mediumPaymentRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberBetween(0.5, 0.799)
        .setBackground('#FFF3CD')
        .setFontColor('#856404')
        .setRanges([feeSheet.getRange(2, 14, finalData.length, 1)])
        .build();
      
      // 付款率 < 50% = 紅色
      const lowPaymentRule = SpreadsheetApp.newConditionalFormatRule()
        .whenNumberLessThan(0.5)
        .setBackground('#F8D7DA')
        .setFontColor('#721C24')
        .setRanges([feeSheet.getRange(2, 14, finalData.length, 1)])
        .build();
      
      const rules = [highPaymentRule, mediumPaymentRule, lowPaymentRule];
      feeSheet.setConditionalFormatRules(rules);
      
      // 添加總計行（在所有數據和月度小計之後）
      const totalRow = finalData.length + 2;
      const totalLabel = '總計';
      
      feeSheet.getRange(totalRow, 1).setValue(totalLabel);
      feeSheet.getRange(totalRow, 2).setValue('全部場地');
      
      // 只對非小計行求和（使用SUMIF排除包含"小計"的行）
      feeSheet.getRange(totalRow, 3).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",C2:C${totalRow-1})`);
      feeSheet.getRange(totalRow, 4).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",D2:D${totalRow-1})`);
      feeSheet.getRange(totalRow, 5).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",E2:E${totalRow-1})`);
      feeSheet.getRange(totalRow, 6).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",F2:F${totalRow-1})`);
      feeSheet.getRange(totalRow, 7).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",G2:G${totalRow-1})`);
      feeSheet.getRange(totalRow, 8).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",H2:H${totalRow-1})`);
      feeSheet.getRange(totalRow, 9).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",I2:I${totalRow-1})`);  // 應付場地方
      feeSheet.getRange(totalRow, 10).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",J2:J${totalRow-1})`); // 已付場地方
      feeSheet.getRange(totalRow, 11).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",K2:K${totalRow-1})`); // 待付場地方
      feeSheet.getRange(totalRow, 12).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",L2:L${totalRow-1})`); // 淨利
      feeSheet.getRange(totalRow, 13).setFormula(`=SUMIF(A2:A${totalRow-1},"<>*小計*",M2:M${totalRow-1})`); // 功夫茶員工分潤
      feeSheet.getRange(totalRow, 14).setFormula(`=IF(C${totalRow}>0, D${totalRow}/C${totalRow}, 0)`); // 付款率
      
      // 設置彙總行格式
      feeSheet.getRange(totalRow, 3, 1, 3).setNumberFormat('#,##0');
      feeSheet.getRange(totalRow, 6, 1, 8).setNumberFormat('#,##0');
      feeSheet.getRange(totalRow, 14).setNumberFormat('0.0%');
      
      // 美化彙總行
      const totalRange = feeSheet.getRange(totalRow, 1, 1, headers.length);
      totalRange.setFontWeight('bold');
      totalRange.setFontSize(11);
      totalRange.setBackground('#E3F2FD');
      totalRange.setBorder(true, true, true, true, false, false, '#000000', SpreadsheetApp.BorderStyle.SOLID_MEDIUM);
      totalRange.setHorizontalAlignment('center');
      
      // 添加更新時間說明
      const updateRow = totalRow + 2;
      feeSheet.getRange(updateRow, 1).setValue(`最後更新時間: ${formatTimestamp()}`);
      feeSheet.getRange(updateRow, 1).setFontSize(9).setFontColor('#999999').setFontStyle('italic');
    }
    
    // 凍結標題行
    feeSheet.setFrozenRows(1);
    
    console.log(`✅ 場地費用結算表已更新，共${resultData.length}個場地統計項目`);
    console.log(`   包含${finalData.length}行數據（含月度小計）`);
    console.log('===================================');
    
    return {
      success: true,
      message: `場地費用結算表已成功創建/更新，共統計${resultData.length}個場地（按月份分組，含月度小計）`,
      locationCount: resultData.length,
      totalRows: finalData.length
    };
    
  } catch (error) {
    console.error('創建場地費用結算表失敗:', error);
    return {
      success: false,
      message: '創建失敗: ' + error.toString(),
      error: error.toString()
    };
  }
}

// 自動更新場地費用結算表（可以設置為定時觸發器）
function autoUpdateLocationFeeSheet() {
  const result = createOrUpdateLocationFeeSheet();
  console.log('自動更新結果:', JSON.stringify(result));
  return result;
}

// 測試場地費用結算表功能
function testLocationFeeSheet() {
  console.log('開始測試場地費用結算表功能...');
  const result = createOrUpdateLocationFeeSheet();
  console.log('測試結果:', JSON.stringify(result, null, 2));
  return result;
}

// 移除工作表保護（一次性使用函數）
function removeSheetProtection() {
  try {
    const SPREADSHEET_ID = '1oS9zTU6DL_cCRnOI6A4ffAeXXn7fXkr6URxxMVprlG4';
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName('Form_Responses1');
    
    if (!sheet) {
      console.log('找不到工作表 Form_Responses1');
      return { success: false, message: '找不到工作表' };
    }
    
    // 取得所有保護範圍
    const protections = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
    console.log(`找到 ${protections.length} 個保護範圍`);
    
    // 移除所有保護
    let removedCount = 0;
    protections.forEach(protection => {
      protection.remove();
      removedCount++;
      console.log(`✅ 已移除保護: ${protection.getRange().getA1Notation()}`);
    });
    
    console.log(`✅ 總共移除了 ${removedCount} 個保護範圍`);
    return { success: true, removedCount: removedCount };
    
  } catch (error) {
    console.error('移除保護失敗:', error);
    return { success: false, error: error.toString() };
  }
}
