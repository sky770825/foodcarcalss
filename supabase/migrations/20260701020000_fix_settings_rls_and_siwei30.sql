-- Fix settings table permissions and ensure Siwei Rd. 30 exists in admin settings.
-- This does not modify food truck booking rows.

GRANT USAGE ON SCHEMA public TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON location_settings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE location_settings_id_seq TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON frontend_notices TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE frontend_notices_id_seq TO anon, authenticated;

GRANT SELECT, INSERT, UPDATE ON statistics_settings TO anon, authenticated;
GRANT USAGE, SELECT ON SEQUENCE statistics_settings_id_seq TO anon, authenticated;

ALTER TABLE location_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE frontend_notices ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access" ON location_settings;
DROP POLICY IF EXISTS "Allow public insert" ON location_settings;
DROP POLICY IF EXISTS "Allow public update" ON location_settings;
DROP POLICY IF EXISTS "Allow public delete" ON location_settings;

CREATE POLICY "Allow public read access" ON location_settings
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON location_settings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON location_settings
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON location_settings
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read access" ON frontend_notices;
DROP POLICY IF EXISTS "Allow public insert" ON frontend_notices;
DROP POLICY IF EXISTS "Allow public update" ON frontend_notices;
DROP POLICY IF EXISTS "Allow public delete" ON frontend_notices;

CREATE POLICY "Allow public read access" ON frontend_notices
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON frontend_notices
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON frontend_notices
  FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete" ON frontend_notices
  FOR DELETE USING (true);

DROP POLICY IF EXISTS "Allow public read" ON statistics_settings;
DROP POLICY IF EXISTS "Allow public insert" ON statistics_settings;
DROP POLICY IF EXISTS "Allow public update" ON statistics_settings;

CREATE POLICY "Allow public read" ON statistics_settings
  FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON statistics_settings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON statistics_settings
  FOR UPDATE USING (true) WITH CHECK (true);

INSERT INTO location_settings (
  location_key,
  location_name,
  address,
  location_type,
  enabled,
  available_days,
  time_slots,
  price_per_slot,
  info,
  notices
) VALUES (
  '開心果團購',
  '開心果團購',
  '楊梅區四維路30號',
  '合作店面',
  true,
  ARRAY[1, 2, 3, 4, 5, 6, 0],
  ARRAY['14:00-20:00'],
  '{"14:00-20:00": "600元"}'::jsonb,
  '{
    "hours": "14:00-20:00",
    "fee": "600元/天",
    "limit": "僅限1車，不要影響到右邊刺青店營業",
    "ban": "煙霧太大、飲料車",
    "special": "整月都可排班",
    "image_url": "https://foodcarboss.pages.dev/assets/locations/siwei-30-happy-dog.jpg"
  }'::jsonb,
  ARRAY[
    '不供水、不供電，需自行清潔環境及垃圾處理',
    '僅限1車，不要影響到右邊刺青店營業',
    '營業時間可供電，200元/天',
    '附近有 7-11 可借用 WC',
    '禁止煙霧太大的餐車',
    '禁止飲料車'
  ]
) ON CONFLICT (location_key) DO UPDATE SET
  location_name = EXCLUDED.location_name,
  address = EXCLUDED.address,
  location_type = EXCLUDED.location_type,
  enabled = EXCLUDED.enabled,
  available_days = EXCLUDED.available_days,
  time_slots = EXCLUDED.time_slots,
  price_per_slot = EXCLUDED.price_per_slot,
  info = EXCLUDED.info,
  notices = EXCLUDED.notices,
  updated_at = NOW();

INSERT INTO statistics_settings (setting_key, setting_value)
VALUES ('default_params', '{"unitFee": 600, "venueFee": 300, "manualAdjust": 0}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;
