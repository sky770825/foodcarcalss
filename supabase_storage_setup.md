# Supabase Storage 設定說明

## 📦 建立 Storage Bucket

1. 登入 Supabase Dashboard：https://supabase.com/dashboard/project/sqgrnowrcvspxhuudrqc
2. 進入 **Storage** 選單
3. 點擊 **New bucket**
4. 設定：
   - **Name**: `foodcarcalss`
   - **Public bucket**: ✅ 勾選（公開存取）
   - **File size limit**: 5 MB（或根據需求調整）
   - **Allowed MIME types**: `image/*`（只允許圖片）

## 🔒 設定 RLS 政策

在 Storage 的 **Policies** 標籤中，為 `foodcarcalss` bucket 添加以下政策：

### 1. 允許公開讀取
```sql
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'foodcarcalss');
```

### 2. 允許公開上傳
```sql
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foodcarcalss');
```

### 3. 允許公開更新（可選）
```sql
CREATE POLICY "Allow public update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'foodcarcalss');
```

### 4. 允許公開刪除（可選）
```sql
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foodcarcalss');
```

## 📁 目錄結構

圖片會自動存儲在以下目錄結構中：
```
foodcarcalss/
  └── payment_images/
      └── {場地名稱}/
          └── {日期}_{餐車名稱}_{時間戳}.{擴展名}
```

例如：
```
foodcarcalss/
  └── payment_images/
      └── 四維路59號/
          └── 20250125_向陽坡刈包_1706179200000.jpg
```

## ✅ 驗證設定

完成設定後，可以：
1. 在前端報名表單中上傳一張測試圖片
2. 檢查 Storage 中是否出現 `payment_images` 目錄
3. 檢查圖片 URL 是否可以公開存取

## 🔧 資料庫欄位更新

請執行 `add_payment_image_column.sql` 來添加 `payment_image_url` 欄位到 `foodcarcalss` 表。
