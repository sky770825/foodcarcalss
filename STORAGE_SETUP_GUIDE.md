# 📦 Supabase Storage 設置完整指南

## ⚠️ 重要：圖片上傳功能需要先設置 Storage Bucket

根據自動化測試結果，`foodcarcalss` bucket 尚未創建。請按照以下步驟設置：

## 📋 步驟 1: 創建 Storage Bucket

### 方法 A: 使用 Supabase Dashboard（推薦）

1. **登入 Supabase Dashboard**
   - 網址：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc
   - 進入 **Storage** 選單（左側導航欄）

2. **創建新 Bucket**
   - 點擊 **"New bucket"** 按鈕
   - 填寫以下資訊：
     - **Name**: `foodcarcalss`（必須完全一致）
     - **Public bucket**: ✅ **勾選**（非常重要！）
     - **File size limit**: `5242880`（5 MB，單位：字節）
     - **Allowed MIME types**: `image/*`（或留空允許所有圖片類型）

3. **點擊 "Create bucket"**

### 方法 B: 使用 SQL（如果 Dashboard 方法不可用）

在 Supabase Dashboard > SQL Editor 中執行：

```sql
-- 注意：此方法可能不支援，建議使用方法 A
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'foodcarcalss',
  'foodcarcalss',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;
```

## 🔒 步驟 2: 設置 RLS 政策

在 Supabase Dashboard > Storage > Policies 中，為 `foodcarcalss` bucket 添加以下政策：

### 政策 1: 允許公開讀取

```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'foodcarcalss');
```

### 政策 2: 允許公開上傳

```sql
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foodcarcalss');
```

### 政策 3: 允許公開更新（可選）

```sql
CREATE POLICY "Allow public update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'foodcarcalss');
```

### 政策 4: 允許公開刪除（可選）

```sql
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foodcarcalss');
```

**快速設置方法：**
1. 進入 Storage > Policies
2. 選擇 `foodcarcalss` bucket
3. 點擊 "New Policy"
4. 選擇 "For full customization"，然後複製貼上上面的 SQL
5. 重複以上步驟添加所有 4 個政策

## ✅ 步驟 3: 驗證設置

### 方法 A: 使用自動化測試腳本

```bash
node test_image_upload.js
```

如果看到 "🎉 所有測試通過！圖片上傳功能正常"，表示設置成功。

### 方法 B: 手動驗證

1. **檢查 Bucket 是否存在**
   - 進入 Storage > Buckets
   - 確認看到 `foodcarcalss` bucket
   - 確認 "Public" 欄位顯示 ✅

2. **檢查政策是否設置**
   - 進入 Storage > Policies
   - 選擇 `foodcarcalss` bucket
   - 確認看到 4 個政策（SELECT, INSERT, UPDATE, DELETE）

3. **測試上傳**
   - 在前端頁面嘗試上傳一張測試圖片
   - 檢查 Storage > `foodcarcalss` > `payment_images` 目錄
   - 確認圖片已上傳

## 🔧 步驟 4: 資料庫欄位更新

確保 `foodcarcalss` 表有 `payment_image_url` 欄位：

在 Supabase Dashboard > SQL Editor 中執行：

```sql
ALTER TABLE foodcarcalss 
ADD COLUMN IF NOT EXISTS payment_image_url TEXT;
```

## 🐛 常見問題排查

### 問題 1: "Bucket not found"
- **原因**: Bucket 尚未創建
- **解決**: 按照步驟 1 創建 bucket

### 問題 2: "new row violates row-level security"
- **原因**: RLS 政策未設置或設置錯誤
- **解決**: 按照步驟 2 設置所有 RLS 政策

### 問題 3: "The resource already exists"
- **原因**: 圖片已存在（正常情況）
- **解決**: 代碼已自動處理，會覆蓋舊文件

### 問題 4: "File size exceeds limit"
- **原因**: 圖片超過 5MB 限制
- **解決**: 壓縮圖片或增加 bucket 的 file_size_limit

### 問題 5: "Invalid MIME type"
- **原因**: 圖片類型不在允許列表中
- **解決**: 檢查 bucket 的 allowed_mime_types 設置

## 📝 設置完成後

設置完成後，請：
1. 重新運行測試：`node test_image_upload.js`
2. 在前端頁面測試上傳功能
3. 檢查後台是否能看到上傳的圖片

## 🆘 需要幫助？

如果遇到問題，請檢查：
1. Supabase Dashboard 中的 Storage 設置
2. 瀏覽器控制台的錯誤訊息
3. 測試腳本的輸出結果
