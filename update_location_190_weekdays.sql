-- 更新四維路190號（自由風）的可預約星期
-- 設定為：星期日、星期一、星期二、星期三、星期四、星期五（不含星期六）
-- 星期對應：0=日, 1=一, 2=二, 3=三, 4=四, 5=五, 6=六

UPDATE location_settings
SET 
  available_days = ARRAY[0, 1, 2, 3, 4, 5],  -- 日、一、二、三、四、五
  updated_at = NOW()
WHERE location_key = '自由風';

-- 驗證更新結果
SELECT 
  location_key,
  location_name,
  address,
  available_days,
  CASE 
    WHEN 0 = ANY(available_days) THEN '✓ 星期日'
    ELSE '✗ 星期日'
  END as 星期日,
  CASE 
    WHEN 1 = ANY(available_days) THEN '✓ 星期一'
    ELSE '✗ 星期一'
  END as 星期一,
  CASE 
    WHEN 2 = ANY(available_days) THEN '✓ 星期二'
    ELSE '✗ 星期二'
  END as 星期二,
  CASE 
    WHEN 3 = ANY(available_days) THEN '✓ 星期三'
    ELSE '✗ 星期三'
  END as 星期三,
  CASE 
    WHEN 4 = ANY(available_days) THEN '✓ 星期四'
    ELSE '✗ 星期四'
  END as 星期四,
  CASE 
    WHEN 5 = ANY(available_days) THEN '✓ 星期五'
    ELSE '✗ 星期五'
  END as 星期五,
  CASE 
    WHEN 6 = ANY(available_days) THEN '✓ 星期六'
    ELSE '✗ 星期六'
  END as 星期六
FROM location_settings
WHERE location_key = '自由風';
