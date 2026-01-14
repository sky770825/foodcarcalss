-- Supabase 資料表建立腳本
-- 資料表名稱: foodcarcalss

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

-- 建立索引以提升查詢效能
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

-- 建立觸發器，自動更新 updated_at
CREATE TRIGGER update_foodcarcalss_updated_at
  BEFORE UPDATE ON foodcarcalss
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 啟用 Row Level Security (RLS)
ALTER TABLE foodcarcalss ENABLE ROW LEVEL SECURITY;

-- 建立政策：允許所有人讀取（根據需求調整）
CREATE POLICY "Allow public read access" ON foodcarcalss
  FOR SELECT
  USING (true);

-- 建立政策：允許所有人插入（根據需求調整）
CREATE POLICY "Allow public insert" ON foodcarcalss
  FOR INSERT
  WITH CHECK (true);

-- 建立政策：允許所有人更新（根據需求調整）
CREATE POLICY "Allow public update" ON foodcarcalss
  FOR UPDATE
  USING (true);

-- 建立政策：允許所有人刪除（根據需求調整）
CREATE POLICY "Allow public delete" ON foodcarcalss
  FOR DELETE
  USING (true);

-- 如果需要更嚴格的安全控制，可以使用以下政策替代：
-- 只允許通過 API Key 認證的請求
-- CREATE POLICY "Allow authenticated users" ON foodcarcalss
--   FOR ALL
--   USING (auth.role() = 'authenticated');
