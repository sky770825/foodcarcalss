# 🔍 場地管理和注意事項管理調試指南

## 問題描述
場地管理和注意事項管理頁面顯示空白，雖然有「載入中」提示，但沒有看到內容。

## 調試步驟

### 1. 打開瀏覽器開發者工具
- 按 `F12` 或 `Cmd+Option+I` (Mac)
- 切換到「Console」標籤

### 2. 檢查控制台日誌
當你切換到「場地管理」或「注意事項管理」標籤時，應該會看到以下日誌：

**場地管理：**
```
📥 載入場地數據成功，共 X 個場地
場地數據: [...]
📋 開始渲染場地列表，共 X 個場地
✅ 場地列表渲染完成，HTML 長度: XXX
```

**注意事項管理：**
```
📥 載入注意事項數據成功，共 X 條注意事項
注意事項數據: [...]
📋 開始渲染注意事項列表，共 X 條注意事項
✅ 注意事項列表渲染完成，HTML 長度: XXX
```

### 3. 檢查可能的錯誤

#### 錯誤 1: 找不到容器
如果看到：
```
❌ 找不到 locationsList 容器
```
或
```
❌ 找不到 noticesList 容器
```

**解決方案：** 檢查 HTML 結構是否正確載入。

#### 錯誤 2: 數據為空
如果看到：
```
⚠️ 場地列表為空
```
或
```
⚠️ 注意事項列表為空
```

**解決方案：** 
1. 檢查 Supabase 資料庫中是否有數據
2. 執行 `npm run auto` 確認數據是否存在
3. 如果沒有數據，執行 `supabase_settings_setup.sql` 初始化數據

#### 錯誤 3: Supabase 客戶端未初始化
如果看到：
```
載入場地資料失敗: Supabase 客戶端未初始化
```

**解決方案：** 檢查 `admin.html` 是否正確載入了 Supabase 客戶端。

### 4. 檢查元素是否存在

在瀏覽器控制台中執行：

```javascript
// 檢查場地管理容器
console.log('locationsList:', document.getElementById('locationsList'));
console.log('tabLocations:', document.getElementById('tabLocations'));

// 檢查注意事項管理容器
console.log('noticesList:', document.getElementById('noticesList'));
console.log('tabNotices:', document.getElementById('tabNotices'));

// 檢查標籤頁是否顯示
console.log('tabLocations active:', document.getElementById('tabLocations')?.classList.contains('active'));
console.log('tabNotices active:', document.getElementById('tabNotices')?.classList.contains('active'));
```

### 5. 手動觸發載入

在瀏覽器控制台中執行：

```javascript
// 手動載入場地
loadLocations();

// 手動載入注意事項
loadNotices();
```

### 6. 檢查 CSS 樣式

在瀏覽器開發者工具中：
1. 選擇「Elements」標籤
2. 找到 `#locationsList` 或 `#noticesList` 元素
3. 檢查是否有 CSS 樣式導致內容不可見（如 `display: none`、`opacity: 0`、`height: 0` 等）

### 7. 檢查數據格式

在瀏覽器控制台中執行：

```javascript
// 檢查場地數據
console.log('allLocations:', window.allLocations || '未定義');

// 檢查注意事項數據
console.log('allNotices:', window.allNotices || '未定義');
```

## 常見問題解決方案

### 問題 1: 標籤頁切換後內容不顯示

**可能原因：** CSS 的 `.tab-content` 沒有正確顯示

**解決方案：** 檢查 `admin.css` 中是否有：
```css
.tab-content {
  display: none;
}

.tab-content.active {
  display: block;
}
```

### 問題 2: 數據載入成功但渲染失敗

**可能原因：** JSONB 欄位格式問題

**解決方案：** 已更新代碼以正確處理 JSONB 欄位（`info`、`notices`、`available_days`）

### 問題 3: 按鈕點擊無反應

**可能原因：** 函數未暴露到全局

**解決方案：** 檢查 `admin.js` 底部是否有：
```javascript
window.loadLocations = loadLocations;
window.loadNotices = loadNotices;
window.showAddLocationModal = showAddLocationModal;
window.showAddNoticeModal = showAddNoticeModal;
```

## 快速修復

如果以上步驟都無法解決問題，請：

1. **清除瀏覽器快取**：`Cmd+Shift+R` (Mac) 或 `Ctrl+Shift+R` (Windows)
2. **檢查網路連線**：確認可以連接到 Supabase
3. **重新載入頁面**：按 `F5` 或 `Cmd+R`
4. **檢查 Supabase 資料庫**：確認 `location_settings` 和 `frontend_notices` 表中有數據

## 聯繫支援

如果問題仍然存在，請提供：
1. 瀏覽器控制台的完整錯誤訊息
2. 網路請求的狀態（Network 標籤）
3. 數據庫中的實際數據（截圖或導出）
