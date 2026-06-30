-- 防止同場地同日期重複報班
--
-- 重要：
-- 1. 請先確認並處理現有重複資料，否則 UNIQUE CONSTRAINT 會建立失敗。
-- 2. 本系統每個場地每天只允許 1 車，因此唯一限制必須是「location + booking_date」。
-- 3. 舊版「location + booking_date + vendor」只能防同一餐車重複送出，無法防不同餐車搶同一天。
--
-- 檢查現有重複資料：
-- SELECT location, booking_date, COUNT(*) AS duplicate_count, ARRAY_AGG(id ORDER BY id) AS ids, ARRAY_AGG(vendor ORDER BY id) AS vendors
-- FROM foodcarcalss
-- GROUP BY location, booking_date
-- HAVING COUNT(*) > 1
-- ORDER BY booking_date, location;
--
-- 若曾執行舊版約束，先移除：
ALTER TABLE foodcarcalss
DROP CONSTRAINT IF EXISTS foodcarcalss_unique_booking;

-- 建立正確的防重複約束：
ALTER TABLE foodcarcalss
ADD CONSTRAINT foodcarcalss_unique_location_date
UNIQUE (location, booking_date);
