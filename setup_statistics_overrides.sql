-- 統計表參數設定表（用於儲存編輯後的參數）
-- 在 Supabase Dashboard → SQL Editor 中執行此腳本

CREATE TABLE IF NOT EXISTS statistics_settings (
  id BIGSERIAL PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 建立更新時間觸發器
CREATE OR REPLACE FUNCTION update_statistics_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_statistics_settings_updated_at ON statistics_settings;
CREATE TRIGGER update_statistics_settings_updated_at
  BEFORE UPDATE ON statistics_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_statistics_settings_updated_at();

-- RLS
ALTER TABLE statistics_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON statistics_settings FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON statistics_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON statistics_settings FOR UPDATE USING (true);

-- 初始化預設值
INSERT INTO statistics_settings (setting_key, setting_value)
VALUES ('default_params', '{"unitFee": 600, "venueFee": 300, "manualAdjust": 0}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
