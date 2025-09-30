// Google Apps Script 代碼 - 用於接收餐車報名數據
// 請將此代碼複製到 Google Apps Script 中

function doGet(e) {
  // 處理GET請求，返回簡單的狀態信息
  return ContentService
    .createTextOutput(JSON.stringify({ 
      status: 'success', 
      message: '餐車排班報名系統運行正常',
      timestamp: new Date().toISOString()
    }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    // 解析接收到的數據
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'addBooking') {
      return addBookingToSheet(data.data);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '未知的操作' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('處理請求時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, message: '服務器錯誤' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addBookingToSheet(bookingData) {
  try {
    // 獲取當前活動的工作表
    const sheet = SpreadsheetApp.getActiveSheet();
    
    // 準備要添加的數據行，匹配您的表格格式
    const rowData = [
      new Date(), // A: 時間戳記
      bookingData.vendor, // B: 您的店名
      bookingData.foodType, // C: 餐車類型
      bookingData.location, // D: 預約場地
      bookingData.date, // E: 預約日期
      '己排班', // F: 己排
      bookingData.fee || '600', // G: 場地費
      '尚未付款', // H: 款項結清
      '場地未結，可排班通知版主' // I: 備註
    ];
    
    // 添加數據到工作表
    sheet.appendRow(rowData);
    
    // 自動調整列寬
    sheet.autoResizeColumns(1, 9);
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: '報名記錄已成功添加到Google Sheets' 
      }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    console.error('添加記錄到工作表時發生錯誤:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        message: '無法添加記錄到工作表' 
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
    timestamp: new Date().toISOString()
  };
  
  const result = addBookingToSheet(testData);
  console.log('測試結果:', result.getContent());
}
