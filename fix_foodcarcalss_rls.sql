-- 修復 foodcarcalss 表 RLS 政策（解決 401 錯誤）
-- 在 Supabase Dashboard → SQL Editor 中執行此腳本

-- 1. 檢查現有政策
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'foodcarcalss';

-- 2. 刪除可能衝突的舊政策
DROP POLICY IF EXISTS "Allow public read access" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public insert" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public update" ON foodcarcalss;
DROP POLICY IF EXISTS "Allow public delete" ON foodcarcalss;

-- 3. 確保 RLS 已啟用
ALTER TABLE foodcarcalss ENABLE ROW LEVEL SECURITY;

-- 4. 建立允許公開存取的政策（anon key 可讀寫）
CREATE POLICY "Allow public read access" ON foodcarcalss
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert" ON foodcarcalss
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON foodcarcalss
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON foodcarcalss
  FOR DELETE USING (true);

-- 5. 驗證：查詢應可正常執行
SELECT COUNT(*) as total_bookings FROM foodcarcalss;
