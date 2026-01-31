# 🔧 Supabase 401 錯誤修復指南

## 問題說明

您遇到的 **401 Unauthorized** 錯誤表示 Supabase 請求被拒絕授權。資料並未消失，但前端無法取得存取權限。

```
Failed to load resource: the server responded with a status of 401 ()
從 Supabase 讀取失敗
```

---

## 可能原因與對應修復步驟

### 1️⃣ 專案已暫停（最常見）

**Supabase 免費方案**在專案 **7 天無活動** 後會自動暫停。

**修復步驟：**
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard)
2. 選擇專案 `sqgrnowrcvspxhuudrqc`
3. 若看到 **「Project is paused」**，點擊 **「Restore project」**
4. 等待約 1–2 分鐘恢復
5. 重新整理前端頁面

---

### 2️⃣ API Key 已變更

若曾在 Supabase 中重新產生 API 金鑰，舊的金鑰會失效。

**檢查與修復步驟：**
1. 前往 [Supabase Dashboard](https://supabase.com/dashboard) → 選擇專案
2. 點擊左側 **Settings** → **API**
3. 在 **Project API keys** 中查看 **anon public** 金鑰
4. 若與專案中的金鑰不同，請更新以下檔案的 `SUPABASE_ANON_KEY` 或 `anonKey`：
   - `script.js`（約第 1352 行）
   - `supabase_client.js`
   - `admin.js`

---

### 3️⃣ 權限不足（permission denied for table foodcarcalss）

若錯誤訊息為 **「permission denied for table foodcarcalss」**，表示 `anon` 角色尚未取得資料表操作權限。

**修復步驟：** 在 Supabase Dashboard 開啟 **SQL Editor**，執行專案中的 `fix_foodcarcalss_rls.sql`，或執行以下 SQL：

```sql
-- 授權 anon 與 authenticated 角色（關鍵步驟）
GRANT ALL ON foodcarcalss TO anon;
GRANT ALL ON foodcarcalss TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE foodcarcalss_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE foodcarcalss_id_seq TO authenticated;

-- 刪除舊政策後重建
DROP POLICY IF EXISTS "Allow public read access" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public insert" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public update" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public delete" ON foodcarcalss;

CREATE POLICY "Allow public read access" ON foodcarcalss FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON foodcarcalss FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON foodcarcalss FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON foodcarcalss FOR DELETE USING (true);
```

### 4️⃣ RLS 政策阻擋（若上述仍無法解決）

Row Level Security（RLS）若設定不當，也可能導致 401。請執行完整的 `fix_foodcarcalss_rls.sql` 腳本。

---

### 5️⃣ 專案 URL 或金鑰輸入錯誤

確認專案使用正確的 URL 和金鑰：

- **URL：** `https://sqgrnowrcvspxhuudrqc.supabase.co`
- **Anon Key：** 從 Dashboard → Settings → API 複製 **anon public**

---

## 快速檢查清單

| 檢查項目           | 說明                          |
|--------------------|-------------------------------|
| 專案是否暫停       | Dashboard 是否有「Restore」   |
| API Key 是否正確   | 對照 Dashboard 中的 anon key  |
| RLS 政策           | 執行上方 SQL 檢查與修復       |
| 網路連線           | 瀏覽器是否能連到 Supabase     |

---

## 驗證修復結果

1. 開啟瀏覽器開發者工具（F12）→ **Console**
2. 重新整理頁面
3. 若修復成功，應可看到類似訊息：
   - `✅ 成功從 Supabase 獲取 X 條預約記錄`
   - `📊 載入預約數: X`

---

## 需要協助時

若依上述步驟仍無法排除 401 錯誤，請提供：

1. Supabase Dashboard 中專案是否顯示為「Active」
2. 執行 RLS 檢查 SQL 後的結果
3. 瀏覽器 Console 中的完整錯誤訊息
