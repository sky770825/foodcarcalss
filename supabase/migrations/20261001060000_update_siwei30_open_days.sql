-- Update 四維路30號 / 開心果團購 to only allow Saturday, Sunday, and Monday new bookings.
UPDATE location_settings
SET
  available_days = ARRAY[6, 0, 1],
  info = jsonb_set(
    COALESCE(info, '{}'::jsonb),
    '{special}',
    '"僅開放週六、週日、週一報班"'::jsonb,
    true
  ),
  updated_at = NOW()
WHERE location_key = '開心果團購';
