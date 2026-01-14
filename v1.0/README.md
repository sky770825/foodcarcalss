# 🚚 楊梅餐車排班報名系統 v3.1.0

> 一個功能完整、界面美觀的餐車排班管理系統，支援多場地預約、付款管理、排班轉讓等功能。

[![系統版本](https://img.shields.io/badge/版本-v3.1.0-blue.svg)](https://github.com/yourusername/foodtruck-booking)
[![Google Apps Script](https://img.shields.io/badge/Google%20Apps%20Script-集成-green.svg)](https://script.google.com)
[![響應式設計](https://img.shields.io/badge/響應式-支援-brightgreen.svg)](https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design)

---

## 📋 目錄

- [功能特色](#-功能特色)
- [技術架構](#-技術架構)
- [系統截圖](#-系統截圖)
- [快速開始](#-快速開始)
- [部署指南](#-部署指南)
- [使用說明](#-使用說明)
- [配置說明](#-配置說明)
- [版本更新](#-版本更新)
- [常見問題](#-常見問題)
- [聯繫我們](#-聯繫我們)

---

## 🎯 功能特色

### 核心功能

#### 📅 **排班預約系統**
- ✅ **快速預約**：一鍵填入當前登入餐車資訊
- ✅ **表單預約**：完整填寫所有預約細節
- ✅ **場地過濾**：依餐車類型智能過濾可預約場地
- ✅ **日期管理**：可視化日曆顯示所有排班
- ✅ **已預約日期過濾**：同一餐車同一場地當日只能預約一次

#### 💰 **付款管理**
- ✅ **三種付款方式**：LINE Pay、ATM轉帳、現金
- ✅ **24小時付款期限**：自動標記逾期排班
- ✅ **付款狀態追蹤**：尚未付款、已付款、己繳款
- ✅ **場地費用統計**：自動計算各場地費用收支

#### 🔄 **排班管理**
- ✅ **轉讓功能**：已付款排班可轉讓給其他餐車
- ✅ **接手逾期排班**：超過24小時未付款的排班可被接手
- ✅ **取消預約**：聯繫官方小幫手協助取消
- ✅ **自動排序**：按照預約日期自動整理

#### 🎨 **使用者體驗**
- ✅ **響應式設計**：完美支援桌面、平板、手機
- ✅ **LINE瀏覽器優化**：針對LINE內建瀏覽器特殊優化
- ✅ **吉祥語載入動畫**：美觀的載入提示
- ✅ **使用教學彈窗**：完整的操作說明
- ✅ **Toast通知**：即時操作反饋

### 管理功能

#### 📊 **數據管理**
- ✅ **Google Sheets 整合**：所有資料即時同步至雲端
- ✅ **中文日期排序**：支援「12月12日」格式智能排序
- ✅ **場地名稱標準化**：自動轉換不同格式的場地名稱
- ✅ **資料驗證**：F欄公式自動判斷排班狀態

#### 🔐 **安全機制**
- ✅ **密碼保護**：管理員功能需密碼驗證
- ✅ **權限控制**：接手/轉讓需換班密碼
- ✅ **資料驗證**：防止重複預約和衝突

---

## 🛠 技術架構

### 前端技術

```
HTML5 + CSS3 + Vanilla JavaScript
├── 響應式設計（RWD）
├── CSS Grid & Flexbox 布局
├── CSS Animations 動畫效果
├── Font Awesome 圖標庫
└── 現代化 UI/UX 設計
```

### 後端技術

```
Google Apps Script (JavaScript)
├── Google Sheets API
├── RESTful API 設計
├── 資料驗證與處理
└── 自動化任務（觸發器）
```

### 資料結構

#### Google Sheets 欄位結構

| 欄位 | 名稱 | 格式 | 說明 |
|------|------|------|------|
| A | 時間戳記 | YYYY/MM/DD HH:MM:SS | 預約建立時間 |
| B | 店名 | 文字 | 餐車名稱 |
| C | 餐車類型 | 文字 | 分類（飲料車/正餐車/小吃車等） |
| D | 預約場地 | 文字 | 場地名稱 |
| E | 預約日期 | 12月12日(星期一) | 中文日期格式 |
| F | 己排 | 己排班/逾繳可排 | 自動計算狀態 |
| G | 場地費 | 數字 | 租金金額 |
| H | 付款狀態 | 尚未付款/已付款/己繳款 | 付款狀態 |
| I | 備註 | 文字 | 其他資訊 |

#### F欄公式邏輯

```excel
=IF(OR(H2="己繳款", H2="已付款"), 
   "己排班", 
   IF(AND(H2="尚未付款", (NOW()-A2)*24>24), 
      "逾繳可排", 
      "己排班"
   )
)
```

**判斷邏輯：**
1. 如果付款狀態為「己繳款」或「已付款」→ 顯示「己排班」
2. 如果付款狀態為「尚未付款」且超過24小時 → 顯示「逾繳可排」
3. 其他情況 → 顯示「己排班」

---

## 📸 系統截圖

### 桌面版界面

```
┌─────────────────────────────────────────────────────────┐
│  📅 排班行事曆 (?)                     [場地過濾按鈕]     │
├─────────────────────────────────────────────────────────┤
│  日  一  二  三  四  五  六                               │
│      1   2   3   4   5   6                              │
│  [餐車A]                [餐車B]                          │
│  已付款  未付款                                          │
│                                                         │
│  7   8   9   10  11  12  13                             │
│  [餐車C] [餐車D]                                         │
│  已付款  逾繳可排                                        │
└─────────────────────────────────────────────────────────┘
```

### 手機版界面

```
┌─────────────────────┐
│ 📅 排班行事曆 (?)     │
├─────────────────────┤
│ [場地] [場地] [場地]  │
│ [場地] [場地] [場地]  │
├─────────────────────┤
│  日  一  二  三       │
│  1   2   3   4       │
│ [A] [B]              │
│ ✓  ⏰               │
└─────────────────────┘
```

---

## 🚀 快速開始

### 前置需求

- Google 帳號
- 現代化瀏覽器（Chrome、Firefox、Safari、Edge）
- 文字編輯器（推薦：VS Code）

### 安裝步驟

#### 1️⃣ 下載專案

```bash
# 方法一：使用 Git
git clone https://github.com/yourusername/foodtruck-booking.git
cd foodtruck-booking

# 方法二：直接下載 ZIP
# 前往 GitHub 頁面下載並解壓縮
```

#### 2️⃣ 設定 Google Sheets

1. **建立 Google Sheets**
   - 前往 [Google Sheets](https://sheets.google.com)
   - 建立新的試算表
   - 複製試算表 ID（URL中的長字串）

2. **設定工作表結構**
   - 建立名為 `Form_Responses1` 的工作表
   - 在第一行設定欄位標題：
     ```
     A: 時間戳記
     B: 店名
     C: 餐車類型
     D: 預約場地
     E: 預約日期
     F: 己排
     G: 場地費
     H: 付款狀態
     I: 備註
     ```

3. **設定資料驗證**
   - H 欄設定下拉選單：`尚未付款`、`已付款`、`己繳款`
   - F 欄設定下拉選單：`己排班`、`逾繳可排`

4. **設定條件格式**
   - 「已付款」/「己繳款」：綠色背景
   - 「尚未付款」：橘色背景
   - 「逾繳可排」：紅色背景

#### 3️⃣ 部署 Google Apps Script

1. **開啟 Apps Script 編輯器**
   ```
   Google Sheets → 擴充功能 → Apps Script
   ```

2. **貼上程式碼**
   - 刪除預設的 `Code.gs`
   - 複製 `google_apps_script.js` 的所有內容
   - 貼上到編輯器中

3. **更新試算表 ID**
   ```javascript
   const SPREADSHEET_ID = '您的試算表ID';
   ```

4. **初始化工作表**
   - 選擇函數：`initializeSheets`
   - 點擊執行（▶️）
   - 授權應用程式存取權限

5. **部署為 Web App**
   ```
   1. 點擊「部署」→「新增部署作業」
   2. 類型：網頁應用程式
   3. 執行身分：我
   4. 具有應用程式存取權的使用者：所有人
   5. 點擊「部署」
   6. 複製 Web App URL
   ```

#### 4️⃣ 配置前端

1. **更新 Web App URL**
   
   編輯 `index.html` 第 4153 行：
   ```javascript
   const GOOGLE_SHEETS_CONFIG = {
     webAppUrl: '您的Web_App_URL',
     enabled: true,
     autoSync: true,
     syncInterval: 30000
   };
   ```

2. **配置場地資訊**
   
   編輯 `index.html` 第 4075 行：
   ```javascript
   const locationConfigs = {
     '場地名稱': {
       type: '場地類型',
       address: '地址',
       fee: 場地費用,
       ban: '禁止類型',
       notice: '注意事項'
     },
     // ... 其他場地
   };
   ```

3. **設定官方小幫手連結**
   
   搜尋並替換所有 `https://lin.ee/BStZlfM` 為您的 LINE 官方帳號連結。

#### 5️⃣ 測試運行

1. **本地測試**
   ```bash
   # 使用任何 HTTP 伺服器
   # 方法一：Python
   python -m http.server 8000
   
   # 方法二：Node.js
   npx http-server
   
   # 方法三：VS Code Live Server 擴充功能
   ```

2. **開啟瀏覽器**
   ```
   http://localhost:8000/index.html
   ```

3. **測試功能**
   - ✅ 快速預約
   - ✅ 表單預約
   - ✅ 付款狀態變更
   - ✅ 轉讓排班
   - ✅ 接手逾期排班

---

## 📦 部署指南

### 部署到 GitHub Pages

1. **建立 GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/foodtruck-booking.git
   git push -u origin main
   ```

2. **啟用 GitHub Pages**
   ```
   Settings → Pages → Source: main branch → Save
   ```

3. **訪問網站**
   ```
   https://yourusername.github.io/foodtruck-booking/
   ```

### 部署到 Cloudflare Pages

1. **連接 GitHub Repository**
2. **構建設定**
   - 構建命令：（無需構建）
   - 輸出目錄：`/`
3. **部署**

### 部署到 Vercel

1. **導入專案**
   ```bash
   vercel
   ```

2. **配置**
   - Framework Preset: Other
   - Build Command: (留空)
   - Output Directory: ./

3. **部署完成**

---

## 📖 使用說明

### 一般用戶操作

#### 🎯 如何預約排班

**方法一：快速預約**
1. 點擊「🚀 快速預約」按鈕
2. 自動填入當前登入的餐車資訊
3. 選擇日期和場地
4. 確認場地費用
5. 點擊「確認預約」

**方法二：完整表單**
1. 填寫所有預約資訊
2. 系統自動過濾禁止類型的場地
3. 確認資訊無誤後提交

#### 💳 付款流程

1. **預約成功後**
   - 系統顯示「尚未付款」狀態
   - 記下場地費用金額

2. **選擇付款方式**
   - 📱 LINE Pay：掃描 QR Code
   - 🏦 ATM 轉帳：使用帳號資訊
   - 💵 現金：現場繳交

3. **上傳付款證明**
   - 截圖付款完成畫面
   - 傳送至[官方小幫手](https://lin.ee/BStZlfM)
   - 等待確認

4. **付款完成**
   - 狀態變更為「✓ 已付款」
   - 排班確定，不會被接手

#### 🔄 轉讓排班

**適用情況：已付款的排班**

1. 點擊行事曆上的已付款排班
2. 選擇「轉讓排班」
3. 填寫接手餐車資訊
4. 輸入換班密碼
5. 確認轉讓

**注意事項：**
- ⚠️ 需先與接手餐車私下完成場租交易
- ⚠️ 轉讓後無法撤銷
- ℹ️ 系統會自動通知官方小幫手

#### 🤝 接手逾期排班

**適用情況：標記為「逾繳可排」的排班**

1. 點擊行事曆上的逾期排班
2. 系統顯示警告訊息
3. 填寫您的餐車資訊
4. 輸入換班密碼
5. 確認接手

**接手後：**
- 成為新的預約者
- 需在24小時內完成付款
- 原預約者無法再操作

#### ❌ 取消預約

**操作流程：**

1. 找到您的排班記錄
2. 聯繫[官方小幫手](https://lin.ee/BStZlfM)
3. 提供以下資訊：
   - 餐車名稱
   - 預約日期
   - 場地名稱
4. 等待官方小幫手處理

### 管理員操作

#### 🔐 密碼管理

**取消密碼**
- 預設：`sky36990`
- 用途：管理員取消預約

**換班密碼**
- 預設：`abc123`
- 用途：轉讓/接手排班驗證

**修改密碼：**

編輯 `index.html`：

```javascript
// 取消密碼（第 3942 行）
if (password !== 'sky36990') {
  // 改為您的密碼
}

// 換班密碼（第 3779 行）
if (takeoverPassword !== 'abc123') {
  // 改為您的密碼
}
```

#### 📊 手動排序資料

在 Google Apps Script 編輯器中：

```javascript
// 選擇函數
sortSheetByDate

// 點擊執行（▶️）
```

執行結果：
```
========== 開始排序工作表（中文日期格式）==========
讀取了 24 行資料
✅ 已排序 24 行資料（按照預約日期遞增）
排序後前5筆資料：
  1. 10月15日(星期二) (數值: 1015)
  2. 10月20日(星期日) (數值: 1020)
  3. 11月5日(星期二) (數值: 1105)
===================================
```

#### 📈 場地費用統計

在 Google Apps Script 編輯器中：

```javascript
// 選擇函數
createOrUpdateLocationFeeSheet

// 點擊執行（▶️）
```

會自動建立「場地費用結算表」工作表：

| 場地名稱 | 總報班數 | 已付款數 | 未付款數 | 總費用 | 已收費用 | 未收費用 | 付款率 |
|---------|---------|---------|---------|--------|---------|---------|--------|
| 漢堡大亨 | 15 | 12 | 3 | 15000 | 12000 | 3000 | 80% |
| 蔬蒔 | 10 | 8 | 2 | 8000 | 6400 | 1600 | 80% |

#### 🔍 診斷工具

在瀏覽器控制台（F12）中執行：

```javascript
// 檢查場地名稱標準化
checkSheetsLocationNames()

// 檢查數據來源
checkDataSource()

// 診斷所有預約
diagnoseAllBookings()

// 清除本地快取
clearLocalCache()
```

---

## ⚙️ 配置說明

### 場地配置

編輯 `index.html` 第 4075 行：

```javascript
const locationConfigs = {
  '漢堡大亨': {
    type: '戶外場地',           // 場地類型
    address: '楊梅區四維路70號', // 地址
    fee: 1000,                   // 場地費
    ban: '無',                   // 禁止類型
    notice: '該場地週日公休，不開放預約', // 注意事項
    closedDays: [0]              // 休息日（0=週日）
  },
  '蔬蒔': {
    type: '戶外場地',
    address: '楊梅區四維路216號',
    fee: 800,
    ban: '飲料車、素食',         // 多個類型用逗號分隔
    notice: '請勿攜帶飲料車或素食類餐車',
    closedDays: [1]              // 週一休息
  }
};
```

### 餐車類型配置

```javascript
const foodTypes = [
  '飲料車',
  '小吃車',
  '正餐車',
  '甜點車',
  '咖啡車',
  '素食車'
];
```

### 付款方式配置

```javascript
const paymentMethods = {
  linepay: {
    name: 'LINE Pay',
    icon: 'fab fa-line',
    qrcode: 'path/to/qrcode.jpg'
  },
  atm: {
    name: 'ATM轉帳',
    icon: 'fas fa-university',
    bankCode: '013',
    accountNumber: '1234567890123',
    accountName: '餐車老闆'
  },
  cash: {
    name: '現金',
    icon: 'fas fa-money-bill-wave',
    note: '請於現場繳交'
  }
};
```

### 系統配置

```javascript
const GOOGLE_SHEETS_CONFIG = {
  webAppUrl: '您的Web_App_URL',
  enabled: true,           // 啟用Google Sheets同步
  autoSync: true,          // 自動同步
  syncInterval: 30000      // 同步間隔（毫秒）
};

const SYSTEM_VERSION = '3.1.0'; // 系統版本

const CACHE_VERSION = 'v3.1.0';  // 快取版本
```

---

## 📝 版本更新

### v3.1.0 (2025-10-11) - 最新版本

**重大功能：**
- ✅ 中文日期排序系統
- ✅ 智能解析「12月12日」格式
- ✅ 自動排序功能強化

**更新內容：**
- 新增 `parseChineseDateToNumber()` 函數
- 新增 `quickSortSheet()` 快速排序
- 所有操作後自動觸發排序
- 更新 Web App URL

### v3.0.1 (2025-10-11)

**優化改進：**
- 🔒 修復輸入框聚焦時彈窗放大問題
- 📝 優化使用教學內容
- 🎨 防止 iOS Safari 自動縮放
- 📱 手機版輸入體驗優化

**變更：**
- 移除所有輸入框的 `transform: scale()` 效果
- 設定 `maximum-scale=1.0, user-scalable=no`
- 手機版輸入框固定 `font-size: 16px`
- 使用教學「取消預約」改為引導聯繫客服

### v3.0.0 (2025-10-11)

**重大更新：**
- 📋 新增使用教學彈窗
- 🔄 F欄公式邏輯優化
- 📊 場地費用結算表
- 🎯 場地名稱標準化

**新增功能：**
- 幫助按鈕和完整教學
- 場地費用自動統計
- 診斷工具函數
- 位置名稱映射系統

### v2.9.0 (2025-10-10)

**介面優化：**
- 🎨 場地卡片顯示優化
- 📱 手機版彈窗調整
- 🎯 按鈕布局改進

### v2.8.0 (2025-10-10)

**性能優化：**
- ⚡ 載入速度優化
- 🚀 減少 API 呼叫延遲
- 📊 控制台性能監控

### v2.7.0 (2025-10-09)

**視覺增強：**
- 🎊 吉祥語載入動畫
- 💫 載入倒數計時
- 🎨 成功/失敗訊息優化

### v2.6.0 (2025-10-09)

**數據同步：**
- 🔄 完全移除本地快取
- ☁️ 強制從 Google Sheets 載入
- 🔍 數據來源追蹤

### v2.5.0 (2025-10-08)

**動畫系統：**
- 🎬 載入動畫實現
- ⏱️ 倒數計時功能
- 💬 載入訊息系統

### v2.4.0 (2025-10-08)

**快取管理：**
- 🗑️ 清除舊資料機制
- 📦 版本控制系統
- 🔄 強制重新載入

### v2.3.0 (2025-10-07)

**瀏覽器相容：**
- 📱 LINE瀏覽器特殊優化
- 🎯 用戶代理檢測
- 🔧 瀏覽器模式顯示

### v2.0.0 (2025-10-06)

**響應式設計：**
- 📱 手機版完整支援
- 💻 桌面版自動縮放
- 🔤 文字自動調整
- 📏 垂直顯示餐車名稱

### v1.0.0 (2025-10-05)

**初始版本：**
- 🎉 基礎預約功能
- 📅 日曆顯示系統
- 💳 付款管理
- 🔄 轉讓/接手功能

---

## ❓ 常見問題

### Q1: 為什麼我的預約沒有顯示在日曆上？

**A:** 可能的原因：

1. **場地名稱不一致**
   - 檢查 Google Sheets 中的場地名稱
   - 使用診斷工具：`checkSheetsLocationNames()`
   - 系統會自動標準化常見格式

2. **日期格式錯誤**
   - 確保 E 欄格式為「12月12日(星期一)」
   - 避免使用其他日期格式

3. **快取問題**
   - 執行：`clearLocalCache()`
   - 重新整理頁面（Ctrl+F5）

### Q2: 如何修改密碼？

**A:** 編輯 `index.html`：

```javascript
// 取消密碼（第 3942 行）
if (password !== '您的新密碼') {

// 換班密碼（第 3779 行）
if (takeoverPassword !== '您的新密碼') {
```

同時在 Google Apps Script 中更新相對應的密碼檢查。

### Q3: 可以隱藏 Google Sheets 工作表嗎？

**A:** 可以！系統通過 API 存取，不受視覺隱藏影響。

✅ 可以隱藏：
- 整個工作表
- 特定欄位（如時間戳記）
- 特定列（如範例資料）

❌ 不可以：
- 刪除或重新命名 `Form_Responses1`
- 刪除 A-I 欄（可以隱藏）
- 移除 F 欄公式

### Q4: 排序功能什麼時候執行？

**A:** 系統會在以下時機自動排序：

- 前端載入資料時
- 新增預約後
- 接手預約後
- 轉讓排班後
- 刪除預約後

也可以手動執行：
```javascript
// 在 Apps Script 編輯器中
sortSheetByDate()
```

### Q5: LINE Pay QR Code 如何更新？

**A:** 編輯 `index.html` 第 2236 行：

```html
<img src="您的QR_Code圖片連結" 
     alt="LINE Pay QR Code" 
     style="width: 200px; height: 200px;">
```

建議將 QR Code 圖片上傳至：
- Imgur
- Google Drive（公開連結）
- Cloudinary

### Q6: 如何新增更多場地？

**A:** 編輯 `index.html` 場地配置：

```javascript
const locationConfigs = {
  // 現有場地...
  
  '新場地名稱': {
    type: '戶外場地',
    address: '完整地址',
    fee: 場地費用,
    ban: '禁止類型',
    notice: '注意事項',
    closedDays: [休息日]
  }
};
```

### Q7: 如何設定定時自動排序？

**A:** 在 Google Apps Script 中：

1. 點擊左側「觸發器」⏰
2. 新增觸發器
3. 設定：
   - 函數：`sortSheetByDate`
   - 事件來源：時間驅動
   - 類型：日計時器
   - 時段：午夜到凌晨1點
4. 儲存

### Q8: 手機版輸入時為什麼會放大？

**A:** v3.0.1 已修復此問題。如果仍有問題：

1. 確認版本是 v3.0.1 或更新
2. 清除瀏覽器快取
3. 檢查 viewport meta 標籤：
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
   ```

### Q9: 如何備份資料？

**A:** Google Sheets 自動備份，也可以：

1. **手動下載**
   - Google Sheets → 檔案 → 下載 → Excel (.xlsx)

2. **設定定期備份**
   - 使用 Apps Script 觸發器
   - 自動發送到 Email
   - 複製到其他 Sheets

3. **版本歷史記錄**
   - Google Sheets → 檔案 → 版本記錄

### Q10: 系統支援多少個場地？

**A:** 理論上無限制，但建議：

- **前端顯示**：10個以內（使用者體驗最佳）
- **場地過濾**：可設定更多，按類型分類
- **性能考量**：20個以內載入速度最佳

---

## 🔧 開發指南

### 專案結構

```
餐車老闆報班表/
├── index.html              # 主要前端檔案（7597行）
├── google_apps_script.js   # Google Apps Script 後端（1995行）
├── README.md              # 專案說明文件
├── index copy 2.html      # 備份檔案（v2.6版本）
├── index copy 3.html      # 備份檔案（v3.1版本）
└── assets/               # 資源檔案（如有）
    ├── images/           # 圖片
    ├── styles/           # 樣式（已內嵌於HTML）
    └── scripts/          # 腳本（已內嵌於HTML）
```

### 核心函數說明

#### 前端 (index.html)

**場地管理：**
```javascript
updateLocationInfo(location)     // 更新場地資訊卡片
filterLocations()                // 過濾可用場地
normalizeLocationName(name)      // 標準化場地名稱
```

**預約管理：**
```javascript
submitToGoogleSheets(data)       // 提交預約到 Google Sheets
quickBooking()                   // 快速預約
showBookingForm()                // 顯示預約表單
```

**日曆系統：**
```javascript
generateCalendar(year, month)    // 生成日曆
renderCalendar()                 // 渲染日曆
updateCalendar()                 // 更新日曆顯示
```

**數據同步：**
```javascript
fetchBookingsFromGoogleSheets()  // 從 Sheets 獲取預約
mergeSheetsDataToCalendar()      // 合併 Sheets 資料到日曆
syncOnlySheetsData()             // 僅同步 Sheets 資料
```

**轉讓/接手：**
```javascript
showTransferModal(event)         // 顯示轉讓彈窗
showTakeoverModal(event)         // 顯示接手彈窗
confirmTransfer()                // 確認轉讓
confirmTakeover()                // 確認接手
```

#### 後端 (google_apps_script.js)

**核心功能：**
```javascript
doGet(e)                         // 處理 GET 請求
doPost(e)                        // 處理 POST 請求
initializeSheets()               // 初始化工作表
```

**預約操作：**
```javascript
addBookingToSheet(data)          // 新增預約
deleteBooking(data)              // 刪除預約
takeoverBooking(data)            // 接手預約
transferBooking(data)            // 轉讓預約
```

**數據查詢：**
```javascript
getAllBookings()                 // 獲取所有預約
getBookedDates()                 // 獲取已預約日期
```

**排序功能：**
```javascript
parseChineseDateToNumber(date)   // 解析中文日期
quickSortSheet(sheet)            // 快速排序
sortSheetByDate()                // 按日期排序
```

**統計功能：**
```javascript
createOrUpdateLocationFeeSheet() // 建立場地費用統計表
autoUpdateLocationFeeSheet()     // 自動更新統計
```

### 開發環境設定

**推薦工具：**
- Visual Studio Code
- Google Apps Script 編輯器
- Chrome DevTools

**VS Code 擴充功能：**
- Live Server
- Prettier - Code formatter
- ESLint
- HTML CSS Support

### 貢獻指南

歡迎提交 Pull Request！請遵循以下步驟：

1. Fork 本專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

**編碼規範：**
- 使用 2 空格縮排
- 函數名稱使用 camelCase
- 註解使用中文
- 保持程式碼整潔

---

## 📄 授權條款

本專案採用 MIT License 授權。

```
MIT License

Copyright (c) 2025 餐車排班系統

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 📞 聯繫我們

**官方小幫手**
- LINE: [https://lin.ee/BStZlfM](https://lin.ee/BStZlfM)

**技術支援**
- Email: support@example.com
- GitHub Issues: [提交問題](https://github.com/yourusername/foodtruck-booking/issues)

**專案網站**
- Demo: [https://yourusername.github.io/foodtruck-booking/](https://yourusername.github.io/foodtruck-booking/)
- Docs: [https://yourusername.github.io/foodtruck-booking/docs/](https://yourusername.github.io/foodtruck-booking/docs/)

---

## 🙏 致謝

感謝以下開源專案：

- [Font Awesome](https://fontawesome.com/) - 圖標庫
- [Google Apps Script](https://developers.google.com/apps-script) - 後端服務
- [Google Sheets API](https://developers.google.com/sheets/api) - 資料儲存

---

## 📊 專案統計

- **程式碼行數**: 9,592 行
  - 前端 (HTML/CSS/JS): 7,597 行
  - 後端 (Apps Script): 1,995 行
  
- **功能數量**: 50+ 個功能
- **支援場地**: 可擴展至無限
- **支援瀏覽器**: Chrome, Firefox, Safari, Edge, LINE

---

<div align="center">

**⭐ 如果這個專案對您有幫助，請給我們一個星星！⭐**

Made with ❤️ by 餐車排班系統團隊

[回到頂部](#-楊梅餐車排班報名系統-v310)

</div>

