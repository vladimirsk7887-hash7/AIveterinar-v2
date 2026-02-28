-- Исправление цен и лимитов тарифов (приведение к landing page)
UPDATE plans SET
  price_monthly_rub = 1990,
  limits = limits || '{"dialogs_per_month": 300}'::jsonb
WHERE id = 'start';

UPDATE plans SET
  price_monthly_rub = 4990,
  limits = limits || '{"dialogs_per_month": 1000}'::jsonb
WHERE id = 'business';

UPDATE plans SET
  price_monthly_rub = 9990
WHERE id = 'pro';
