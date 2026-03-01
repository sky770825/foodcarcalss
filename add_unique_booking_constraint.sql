-- 防止重複報班：為「場地 + 日期 + 餐車」加上唯一限制
-- 
-- 步驟：
-- 1. 先開啟「檢查重複數據.html」，刪除所有重複記錄（保留每組最新一筆）
-- 2. 再於 Supabase Dashboard → SQL Editor 執行本腳本
--
-- 執行後：前端送出相同「場地+日期+餐車」時會自動更新該筆，不再新增重複。

-- 若目前仍有重複資料，此指令會失敗，請先完成步驟 1
ALTER TABLE foodcarcalss 
ADD CONSTRAINT foodcarcalss_unique_booking 
UNIQUE (location, booking_date, vendor);
