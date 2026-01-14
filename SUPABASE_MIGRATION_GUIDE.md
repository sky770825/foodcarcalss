# Supabase 遷移指南

本指南將幫助您將 Google Sheets 資料遷移到 Supabase。

## 📋 前置準備

### 1. 獲取 Supabase 專案資訊

1. 登入 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇您的專案：`sqgrnowrcvspxhuudrqc`
3. 進入 **Settings** > **API**
4. 複製以下資訊：
   - **Project URL**: `https://sqgrnowrcvspxhuudrqc.supabase.co`
   - **anon/public key**: 用於前端應用

## 🗄️ 步驟 1: 建立資料表

### 方法 A: 使用 Supabase Dashboard

1. 進入 **Database** > **SQL Editor**
2. 點擊 **New Query**
3. 複製 `supabase_setup.sql` 的內容
4. 貼上並執行

### 方法 B: 使用 SQL Editor

直接在 Supabase Dashboard 的 SQL Editor 中執行以下 SQL：

```sql
-- 建立預約資料表
CREATE TABLE IF NOT EXISTS foodcarcalss (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  vendor TEXT NOT NULL,
  food_type TEXT,
  location TEXT NOT NULL,
  booking_date TEXT NOT NULL,
  status TEXT DEFAULT '己排',
  fee TEXT DEFAULT '600元/天',
  payment TEXT DEFAULT '未繳款',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_foodcarcalss_location ON foodcarcalss(location);
CREATE INDEX IF NOT EXISTS idx_foodcarcalss_booking_date ON foodcarcalss(booking_date);
CREATE INDEX IF NOT EXISTS idx_foodcarcalss_payment ON foodcarcalss(payment);
CREATE INDEX IF NOT EXISTS idx_foodcarcalss_created_at ON foodcarcalss(created_at);

-- 建立更新時間的自動更新函數
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器
CREATE TRIGGER update_foodcarcalss_updated_at
  BEFORE UPDATE ON foodcarcalss
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 Row Level Security
ALTER TABLE foodcarcalss ENABLE ROW LEVEL SECURITY;

-- 建立政策（允許公開讀寫，可根據需求調整）
CREATE POLICY "Allow public read access" ON foodcarcalss
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON foodcarcalss
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON foodcarcalss
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON foodcarcalss
  FOR DELETE USING (true);
```

## 📦 步驟 2: 安裝依賴（用於遷移腳本）

如果您要使用 Node.js 遷移腳本：

```bash
npm init -y
npm install @supabase/supabase-js
```

## 🔄 步驟 3: 執行資料遷移

### 方法 A: 使用 Node.js 遷移腳本

1. 編輯 `migrate_to_supabase.js`
2. 填入您的 Supabase 資訊：
   ```javascript
   const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
   const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
3. 執行遷移：
   ```bash
   node migrate_to_supabase.js
   ```

### 方法 B: 手動遷移（使用 Supabase Dashboard）

1. 從 Google Sheets 匯出資料為 CSV
2. 進入 Supabase Dashboard > **Table Editor** > **foodcarcalss**
3. 點擊 **Insert** > **Import data from CSV**
4. 上傳 CSV 檔案並對應欄位

### 方法 C: 使用 Google Apps Script 直接遷移

建立一個新的 Google Apps Script 函數來遷移資料：

```javascript
function migrateToSupabase() {
  // 獲取所有預約資料
  const bookings = getAllBookings();
  
  // 使用 Supabase REST API 插入資料
  const supabaseUrl = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
  const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';
  
  bookings.bookings.forEach(booking => {
    const payload = {
      timestamp: booking.timestamp,
      vendor: booking.vendor,
      food_type: booking.foodType,
      location: booking.location,
      booking_date: booking.date,
      status: booking.status || booking.bookedStatus,
      fee: booking.fee,
      payment: booking.payment,
      note: booking.note
    };
    
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      payload: JSON.stringify(payload)
    };
    
    UrlFetchApp.fetch(`${supabaseUrl}/rest/v1/foodcarcalss`, options);
  });
}
```

## 🔧 步驟 4: 更新前端代碼

### 在 HTML 中引入 Supabase

在 `index.html` 和 `admin.html` 的 `<head>` 中添加：

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

### 更新 API 配置

在 `script.js` 和 `admin.js` 中：

```javascript
// 替換 Google Sheets API
const SUPABASE_URL = 'https://sqgrnowrcvspxhuudrqc.supabase.co';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';

// 初始化 Supabase 客戶端
const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_KEY);
```

### 使用 Supabase 客戶端

參考 `supabase_client.js` 中的函數來替換現有的 API 調用。

## 🔐 安全設定建議

### 1. 調整 Row Level Security (RLS) 政策

如果需要更嚴格的安全控制，可以修改 RLS 政策：

```sql
-- 刪除公開政策
DROP POLICY IF EXISTS "Allow public read access" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public insert" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public update" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public delete" ON foodcarcalss;

-- 建立需要認證的政策
CREATE POLICY "Allow authenticated users" ON foodcarcalss
  FOR ALL
  USING (auth.role() = 'authenticated');
```

### 2. 使用 Service Role Key（僅後台使用）

對於後台管理系統，建議使用 Service Role Key 而不是 Anon Key：

1. 進入 **Settings** > **API**
2. 複製 **service_role key**（⚠️ 請妥善保管，不要暴露在前端代碼中）
3. 僅在後台系統中使用

## 📊 資料表結構對照

| Google Sheets | Supabase | 說明 |
|--------------|----------|------|
| A: 時間戳記 | timestamp | TIMESTAMPTZ |
| B: 您的店名 | vendor | TEXT |
| C: 餐車類型 | food_type | TEXT |
| D: 預約場地 | location | TEXT |
| E: 預約日期 | booking_date | TEXT |
| F: 己排 | status | TEXT |
| G: 場地費 | fee | TEXT |
| H: 款項結清 | payment | TEXT |
| I: 備註 | note | TEXT |
| - | id | BIGSERIAL (主鍵) |
| - | created_at | TIMESTAMPTZ |
| - | updated_at | TIMESTAMPTZ |

## ✅ 驗證遷移

遷移完成後，請檢查：

1. 資料筆數是否一致
2. 重要欄位是否正確
3. 測試 CRUD 操作是否正常

## 🆘 常見問題

### Q: 如何確認資料已成功遷移？

A: 在 Supabase Dashboard > **Table Editor** > **foodcarcalss** 中查看資料。

### Q: 遷移後如何切換系統？

A: 建議先並行運行兩套系統，確認 Supabase 正常運作後再完全切換。

### Q: 如何回滾到 Google Sheets？

A: 保留 Google Sheets 作為備份，需要時可以重新遷移。

## 📝 下一步

1. ✅ 建立 Supabase 資料表
2. ✅ 遷移資料
3. ⏳ 更新前端代碼使用 Supabase
4. ⏳ 測試所有功能
5. ⏳ 完全切換到 Supabase

---

**注意事項：**
- 請妥善保管 Supabase API Keys
- 建議先在測試環境中驗證
- 保留 Google Sheets 作為備份
