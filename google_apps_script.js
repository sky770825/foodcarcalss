// Google Apps Script 代碼 - 用於接收餐車報名數據
// 請將此代碼複製到 Google Apps Script 中

function doGet(e) {
  // 檢查是否有報名數據參數
  if (e.parameter.vendor) {
    // 有報名數據，處理報名
    const bookingData = {
      vendor: e.parameter.vendor || '未提供',
      location: e.parameter.location || '未提供',
      date: e.parameter.date || '未提供',
      timeSlot: e.parameter.timeSlot || '14:00-20:00',
      foodType: e.parameter.foodType || '未提供',
      fee: e.parameter.fee || '600',
      timestamp: e.parameter.timestamp || new Date().toISOString()
    };
    
    const result = addBookingToSheet(bookingData);
    
    // 檢查是否為 JSONP 請求
    if (e.parameter.callback) {
      const callback = e.parameter.callback;
      const jsonpResponse = `${callback}(${result.getContent()})`;
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return result;
    }
  } else {
    // 沒有報名數據，返回狀態信息
    const response = { 
      status: 'success', 
      message: '餐車排班報名系統運行正常',
      timestamp: new Date().toISOString()
    };
    
    // 檢查是否為 JSONP 請求
    if (e.parameter.callback) {
      const callback = e.parameter.callback;
      const jsonpResponse = `${callback}(${JSON.stringify(response)})`;
      return ContentService
        .createTextOutput(jsonpResponse)
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    } else {
      return ContentService
        .createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    }
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
          timestamp: formData.timestamp || new Date().toISOString()
        };
      }
    } else {
      // 處理 JSON 數據
      data = JSON.parse(e.postData.contents);
    }
    
    // 直接處理報名數據
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
    const SPREADSHEET_ID = '1cvWXGKA9-Oa_-aznD6J0YBW5uqf_J92fCdQYBTkOoQ4';
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
      
      const date = new Date(dateStr);
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
    
    // 準備要添加的數據行，匹配您 Google Sheets 第7行的格式
    const rowData = [
      new Date(), // A: 時間戳記
      bookingData.vendor || '未提供', // B: 您的店名
      bookingData.foodType || '未提供', // C: 餐車類型
      getLocationAddress(bookingData.location), // D: 預約場地 - 顯示完整地址
      formatDate(bookingData.date), // E: 預約日期 - 格式化為「10月16日(星期四)」
      '己排班', // F: 己排
      bookingData.fee || '600', // G: 場地費
      '尚未付款', // H: 款項結清
      '繳交場租，單據上傳官方帳號人工審核' // I: 備註
    ];
    
    console.log('準備添加的數據:', rowData);
    
    // 添加數據到工作表
    sheet.appendRow(rowData);
    console.log('數據已成功添加到工作表');
    
    // 獲取最後一行的行號
    const lastRow = sheet.getLastRow();
    
    // 設定時間戳記欄位（A欄）為文字格式，防止自動轉換
    sheet.getRange(lastRow, 1).setNumberFormat('@');
    
    // 設定日期欄位（E欄）為文字格式，防止自動轉換
    sheet.getRange(lastRow, 5).setNumberFormat('@');
    
    // 移除自動調整列寬功能，保持原有表格格式
    // sheet.autoResizeColumns(1, 9);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '報名記錄已成功添加到Google Sheets',
        data: bookingData
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

function getOrCreateSheet(sheetName) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
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
    timestamp: new Date().toISOString()
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
        timestamp: new Date().toISOString()
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
      timestamp: new Date().toISOString()
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
