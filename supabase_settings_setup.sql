-- Supabase 設定管理資料表建立腳本
-- 用於管理場地配置和前端注意事項

-- ========== 場地配置表 ==========
CREATE TABLE IF NOT EXISTS location_settings (
  id BIGSERIAL PRIMARY KEY,
  location_key TEXT NOT NULL UNIQUE, -- 場地唯一識別碼，例如：'四維路59號'
  location_name TEXT NOT NULL, -- 顯示名稱，例如：'楊梅區四維路59號'
  address TEXT NOT NULL, -- 完整地址
  location_type TEXT DEFAULT '戶外場地', -- 場地類型
  enabled BOOLEAN DEFAULT true, -- 是否啟用（關閉場地）
  available_days INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 可預約的星期幾 [0=日, 1=一, ..., 6=六]
  time_slots TEXT[] DEFAULT ARRAY['14:00-20:00'], -- 可用時段
  price_per_slot JSONB DEFAULT '{"14:00-20:00": "600元"}'::jsonb, -- 各時段價格
  info JSONB DEFAULT '{}'::jsonb, -- 場地資訊（hours, fee, limit, ban, special）
  notices TEXT[] DEFAULT ARRAY[]::TEXT[], -- 注意事項列表
  closed_dates DATE[] DEFAULT ARRAY[]::DATE[], -- 關閉的特定日期
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_location_settings_key ON location_settings(location_key);
CREATE INDEX IF NOT EXISTS idx_location_settings_enabled ON location_settings(enabled);

-- ========== 前端注意事項表 ==========
CREATE TABLE IF NOT EXISTS frontend_notices (
  id BIGSERIAL PRIMARY KEY,
  notice_key TEXT NOT NULL UNIQUE, -- 注意事項唯一識別碼
  title TEXT NOT NULL, -- 標題
  content TEXT NOT NULL, -- 內容（可以是 HTML）
  display_order INTEGER DEFAULT 0, -- 顯示順序
  enabled BOOLEAN DEFAULT true, -- 是否啟用
  notice_type TEXT DEFAULT 'general', -- 類型：general, warning, info, success
  target_location TEXT, -- 針對特定場地（NULL 表示通用）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_frontend_notices_key ON frontend_notices(notice_key);
CREATE INDEX IF NOT EXISTS idx_frontend_notices_enabled ON frontend_notices(enabled);
CREATE INDEX IF NOT EXISTS idx_frontend_notices_order ON frontend_notices(display_order);

-- ========== 更新時間觸發器 ==========
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_settings_updated_at
  BEFORE UPDATE ON location_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

CREATE TRIGGER update_frontend_notices_updated_at
  BEFORE UPDATE ON frontend_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_settings_updated_at();

-- ========== Row Level Security (RLS) ==========
ALTER TABLE location_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE frontend_notices ENABLE ROW LEVEL SECURITY;

-- 允許所有人讀取
CREATE POLICY "Allow public read access" ON location_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow public read access" ON frontend_notices
  FOR SELECT USING (true);

-- 允許所有人插入、更新、刪除（根據需求調整）
CREATE POLICY "Allow public insert" ON location_settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON location_settings
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON location_settings
  FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON frontend_notices
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update" ON frontend_notices
  FOR UPDATE USING (true);

CREATE POLICY "Allow public delete" ON frontend_notices
  FOR DELETE USING (true);

-- ========== 初始化資料（從現有配置遷移） ==========
-- 四維路59號
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '四維路59號',
  '楊梅區四維路59號',
  '楊梅區四維路59號',
  '戶外場地',
  ARRAY[1, 2, 3, 4, 5, 6, 0],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車，餐車高度限制", "ban": "油炸落地攤、煙霧太大、飲料車", "special": "整月都可排班"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '禁止油炸落地攤，其他可以不限，禁煙霧太大',
    '禁止飲料及飲料車',
    '餐車高度限制，請特別注意',
    '房東很注重地板要記得鋪地墊',
    '桶仔雞煙霧太大不行',
    '發電機老式太吵不行'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 四維路60號
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '四維路60號',
  '楊梅區四維路60號',
  '楊梅區四維路60號',
  '戶外場地',
  ARRAY[1, 2, 3],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車", "ban": "油炸落地攤、煙霧太大", "special": "該場地週一~週三營業，國定假日休息"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '要靠左邊直停為主',
    '使用面積較小的餐車可以橫放',
    '落地攤也可以橫放',
    '禁止油炸落地攤、煙霧太大'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 漢堡大亨（四維路70號）
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '漢堡大亨',
  '漢堡大亨',
  '楊梅區四維路70號',
  '店面場地',
  ARRAY[1, 2, 3, 4, 5, 6, 0],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車", "ban": "飲料車", "special": "整月都可排班"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '僅限1車',
    '禁止飲料車',
    '請勿與店面商品強碰'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 自由風（四維路190號）
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '自由風',
  '自由風',
  '楊梅區四維路190號',
  '店面場地',
  ARRAY[1, 2, 3, 4, 5, 6, 0],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車", "ban": "飲料車", "special": "整月都可排班"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '僅限1車',
    '禁止飲料車'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 蔬蒔（四維路216號）
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '蔬蒔',
  '蔬蒔',
  '楊梅區四維路216號',
  '健康蔬食',
  ARRAY[3, 6],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車，不要跟店面強碰商品", "ban": "飲料車、素食", "special": "只有週三、週六可排班"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '僅限1車，請勿與店面商品強碰',
    '只有週三、週六可排班',
    '禁止飲料車、素食',
    '建議健康蔬食類型餐車'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 金正好吃（四維路218號）
INSERT INTO location_settings (location_key, location_name, address, location_type, available_days, info, notices)
VALUES (
  '金正好吃',
  '金正好吃',
  '楊梅區四維路218號',
  '美食廣場',
  ARRAY[2],
  '{"hours": "14:00-20:00", "fee": "600元/天", "limit": "僅限1車", "ban": "煙霧太大、噪音過大", "special": "該場地僅限週二營業"}'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '僅限1車',
    '禁止煙霧太大的餐車',
    '禁止噪音過大的設備',
    '僅限週二營業'
  ]
) ON CONFLICT (location_key) DO NOTHING;

-- 通用注意事項
INSERT INTO frontend_notices (notice_key, title, content, display_order, notice_type)
VALUES 
  ('general_1', '基本規則', '不供水、不供電，需自行清潔環境及垃圾處理', 1, 'warning'),
  ('general_2', '禁止事項', '禁止油炸落地攤，其他可以不限，禁煙霧太大', 2, 'warning'),
  ('general_3', '飲料車限制', '禁止飲料及飲料車', 3, 'warning')
ON CONFLICT (notice_key) DO NOTHING;
