-- 添加匯款圖片欄位到 foodcarcalss 表
ALTER TABLE foodcarcalss 
ADD COLUMN IF NOT EXISTS payment_image_url TEXT;

-- 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_foodcarcalss_payment_image ON foodcarcalss(payment_image_url) 
WHERE payment_image_url IS NOT NULL;
