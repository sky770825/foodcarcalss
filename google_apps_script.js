// Google Apps Script 代碼 - 用於接收餐車報名數據
// 請將此代碼複製到 Google Apps Script 中

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
      cancelledAt: e.parameter.cancelledAt || new Date().toISOString()
    };
    
    const result = cancelBookingFromSheet(cancelData);
    
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
    
    // 檢查是否有接手預約請求
    if (data.action === 'takeover') {
      return takeoverBooking(data);
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
      '己排班', // F: 己排（會由公式自動處理）
      bookingData.fee || '600', // G: 場地費
      '尚未付款', // H: 款項結清
      '繳交場租，單據上傳官方帳號人工審核' // I: 備註
    ];
    
    console.log('準備添加的數據:', rowData);
    
    // 尋找第一個空行（從第10行開始，跳過標題和示例）
    let targetRow = 10;
    const lastRow = sheet.getLastRow();
    
    // 檢查是否有空行可以插入
    for (let row = 10; row <= lastRow; row++) {
      const vendorValue = sheet.getRange(row, 2).getValue(); // B欄：店名
      if (!vendorValue || vendorValue === '') {
        targetRow = row;
        break;
      }
    }
    
    // 如果沒有找到空行，則添加新行
    if (targetRow > lastRow) {
      targetRow = lastRow + 1;
    }
    
    console.log(`將數據插入到第 ${targetRow} 行`);
    
    // 插入數據到指定行
    sheet.getRange(targetRow, 1, 1, 9).setValues([rowData]);
    console.log('數據已成功插入到工作表');
    
    // 設定時間戳記欄位（A欄）為文字格式，防止自動轉換
    sheet.getRange(targetRow, 1).setNumberFormat('@');
    
    // 設定日期欄位（E欄）為文字格式，防止自動轉換，並置中對齊
    sheet.getRange(targetRow, 5).setNumberFormat('@');
    sheet.getRange(targetRow, 5).setHorizontalAlignment('center');
    
    // 移除自動調整列寬功能，保持原有表格格式
    // sheet.autoResizeColumns(1, 9);
    
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
        // 處理 "2024-10-01" 格式
        date = new Date(dateStr);
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
    
    // 從第8行開始搜尋（跳過標題行）
    for (let i = 7; i < values.length; i++) {
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
      timestamp: new Date().toISOString()
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
    
    // 6. 設定F欄（己排）的自動公式
    // 在F10開始添加公式：如果F欄是"己排班"且距離預約時間超過1天，則顯示"逾繳可排"
    const overdueFormula = '=IF(F10="己排班",IF(NOW()-A10>1,"逾繳可排","己排班"),"")';
    
    // 手動設定每一行的公式（因為需要動態行號）
    for (let row = 10; row <= 1000; row++) {
      const rowFormula = `=IF(F${row}="己排班",IF(NOW()-A${row}>1,"逾繳可排","己排班"),"")`;
      sheet.getRange(`F${row}`).setFormula(rowFormula);
    }
    
    // 7. 設定數據驗證（H欄：款項結清）
    const paymentRule = SpreadsheetApp.newDataValidation()
      .requireValueInList(['尚未付款', '已付款', '部分付款'], true)
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
    
    // 獲取所有數據（從第8行開始，跳過標題行）
    const lastRow = sheet.getLastRow();
    if (lastRow < 8) {
      console.log('沒有數據行');
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '沒有預約記錄',
          bookings: [],
          lastUpdate: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getRange(8, 1, lastRow - 7, 9); // 從第8行開始，讀取9列
    const values = dataRange.getValues();
    
    console.log(`讀取了 ${values.length} 行數據`);
    
    // 轉換為JSON格式
    const bookings = [];
    for (let i = 0; i < values.length; i++) {
      const row = values[i];
      
      // 跳過空行
      if (!row[1] || row[1] === '') continue;
      
      const booking = {
        timestamp: row[0] ? (row[0] instanceof Date ? row[0].toISOString() : row[0].toString()) : '',
        vendor: row[1] || '',           // B: 您的店名
        foodType: row[2] || '',          // C: 餐車類型
        location: row[3] || '',          // D: 預約場地
        date: row[4] || '',              // E: 預約日期
        status: row[5] || '',            // F: 己排
        bookedStatus: row[5] || '',      // F: 己排狀態（包含公式結果）
        fee: row[6] || '',               // G: 場地費
        payment: row[7] || '',           // H: 款項結清
        note: row[8] || '',              // I: 備註
        rowNumber: i + 8                 // 記錄在第幾行，方便後續更新
      };
      
      bookings.push(booking);
    }
    
    console.log(`成功轉換 ${bookings.length} 條預約記錄`);
    
    // 返回結果
    const result = {
      success: true,
      message: `成功獲取 ${bookings.length} 條預約記錄`,
      bookings: bookings,
      lastUpdate: new Date().toISOString(),
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
          lastUpdate: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const lastRow = sheet.getLastRow();
    if (lastRow < 8) {
      return ContentService
        .createTextOutput(JSON.stringify({ 
          success: true, 
          message: '沒有預約記錄',
          bookedDates: {},
          lastUpdate: new Date().toISOString()
        }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    const dataRange = sheet.getRange(8, 1, lastRow - 7, 9);
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
          const year = new Date().getFullYear();
          const standardDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          
          bookedDates[location].push({
            originalDate: date,
            standardDate: standardDate,
            vendor: row[1] || ''
          });
        }
      }
    }
    
    console.log('已預約日期整理完成:', JSON.stringify(bookedDates));
    
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: true, 
        message: `成功獲取已預約日期`,
        bookedDates: bookedDates,
        lastUpdate: new Date().toISOString()
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
      
      for (let i = 7; i < data.length; i++) { // 從第8行開始（索引7）
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
      
      if (!rowNumber || rowNumber < 8) {
        return ContentService
          .createTextOutput(JSON.stringify({
            success: false,
            message: '找不到對應的預約記錄'
          }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
    
    // 更新該行的預約資訊
    const newTimestamp = new Date().toISOString();
    const formattedDate = formatDateForSheet(takeoverData.date);
    
    console.log(`準備更新第${rowNumber}行: 新餐車=${takeoverData.vendor}, 原餐車=${takeoverData.originalVendor}`);
    
    // 更新行數據
    sheet.getRange(rowNumber, 1).setValue(newTimestamp); // A: 時間戳記
    sheet.getRange(rowNumber, 2).setValue(takeoverData.vendor); // B: 店名
    sheet.getRange(rowNumber, 3).setValue(takeoverData.foodType); // C: 餐車類型
    sheet.getRange(rowNumber, 4).setValue(takeoverData.location); // D: 預約場地
    sheet.getRange(rowNumber, 5).setValue(formattedDate); // E: 預約日期
    sheet.getRange(rowNumber, 6).setValue('是'); // F: 己排
    sheet.getRange(rowNumber, 7).setValue(takeoverData.fee); // G: 場地費
    sheet.getRange(rowNumber, 8).setValue('尚未付款'); // H: 款項結清
    sheet.getRange(rowNumber, 9).setValue(`接手自: ${takeoverData.originalVendor}`); // I: 備註
    
    console.log(`✅ 成功接手預約 - 行號: ${rowNumber}, 新餐車: ${takeoverData.vendor}`);
    
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
