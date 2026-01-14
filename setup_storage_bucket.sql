-- Supabase Storage Bucket 設置腳本
-- 請在 Supabase Dashboard > SQL Editor 中執行此腳本

-- ========== 創建 Storage Bucket ==========
-- 注意：如果 bucket 已存在，此命令會失敗，這是正常的

-- 方法 1: 使用 SQL（如果支援）
-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'foodcarcalss',
--   'foodcarcalss',
--   true,
--   5242880, -- 5MB
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
-- )
-- ON CONFLICT (id) DO NOTHING;

-- ⚠️ 注意：Storage bucket 通常需要在 Dashboard 中手動創建
-- 請按照以下步驟操作：
-- 1. 進入 Supabase Dashboard > Storage
-- 2. 點擊 "New bucket"
-- 3. 設置：
--    - Name: foodcarcalss
--    - Public bucket: ✅ 勾選
--    - File size limit: 5 MB
--    - Allowed MIME types: image/*

-- ========== 設置 RLS 政策 ==========

-- 1. 允許公開讀取
CREATE POLICY IF NOT EXISTS "Allow public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'foodcarcalss');

-- 2. 允許公開上傳
CREATE POLICY IF NOT EXISTS "Allow public upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'foodcarcalss');

-- 3. 允許公開更新（可選）
CREATE POLICY IF NOT EXISTS "Allow public update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'foodcarcalss');

-- 4. 允許公開刪除（可選）
CREATE POLICY IF NOT EXISTS "Allow public delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'foodcarcalss');

-- ========== 驗證設置 ==========
-- 執行以下查詢來驗證 bucket 是否存在：
-- SELECT * FROM storage.buckets WHERE name = 'foodcarcalss';

-- 執行以下查詢來驗證政策是否設置：
-- SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
