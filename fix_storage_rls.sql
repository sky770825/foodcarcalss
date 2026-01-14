-- 修復 Supabase Storage RLS 政策
-- 請在 Supabase Dashboard > SQL Editor 中執行此腳本

-- ========== 設置 Storage RLS 政策 ==========
-- 這些政策允許公開讀取和上傳圖片到 foodcarcalss bucket

-- 先刪除可能存在的舊政策（如果有的話）
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete" ON storage.objects;

-- 1. 允許公開讀取
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'foodcarcalss');

-- 2. 允許公開上傳（最重要！）
CREATE POLICY "Allow public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foodcarcalss');

-- 3. 允許公開更新（可選，用於覆蓋已存在的文件）
CREATE POLICY "Allow public update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'foodcarcalss');

-- 4. 允許公開刪除（可選，用於清理測試文件）
CREATE POLICY "Allow public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foodcarcalss');

-- ========== 驗證設置 ==========
-- 執行以下查詢來驗證政策是否設置成功：
-- SELECT policyname, cmd, qual, with_check 
-- FROM pg_policies 
-- WHERE schemaname = 'storage' 
--   AND tablename = 'objects' 
--   AND policyname LIKE '%foodcarcalss%';

-- 如果看到 4 個政策（SELECT, INSERT, UPDATE, DELETE），表示設置成功！
