-- ═══════════════════════════════════════════════════════════
-- AI-Ветеринар SaaS — Seed Data
-- ═══════════════════════════════════════════════════════════

INSERT INTO plans (id, name, price_monthly_rub, limits, features) VALUES
  ('trial', 'Пробный', 0, '{
    "dialogs_per_month": 20,
    "messages_per_dialog": 30,
    "tokens_included": 500000,
    "overage": "block",
    "tg_chats": 1,
    "widgets": 1
  }'::jsonb, '{
    "custom_branding": false,
    "custom_prompt": false,
    "analytics": "basic",
    "choose_provider": false
  }'::jsonb),

  ('start', 'Старт', 299000, '{
    "dialogs_per_month": 100,
    "messages_per_dialog": 50,
    "tokens_included": 2000000,
    "overage": "block",
    "tg_chats": 1,
    "widgets": 1
  }'::jsonb, '{
    "custom_branding": true,
    "custom_prompt": false,
    "analytics": "basic",
    "choose_provider": false
  }'::jsonb),

  ('business', 'Бизнес', 599000, '{
    "dialogs_per_month": 500,
    "messages_per_dialog": 100,
    "tokens_included": 10000000,
    "overage": "charge",
    "overage_cost_per_1k_rub": 3,
    "hard_cap_rub": 3000000,
    "tg_chats": 3,
    "widgets": 3
  }'::jsonb, '{
    "custom_branding": true,
    "custom_prompt": true,
    "analytics": "extended",
    "choose_provider": true
  }'::jsonb),

  ('pro', 'Про', 999000, '{
    "dialogs_per_month": 2000,
    "messages_per_dialog": 200,
    "tokens_included": 50000000,
    "overage": "charge",
    "overage_cost_per_1k_rub": 1.5,
    "hard_cap_rub": 10000000,
    "tg_chats": 10,
    "widgets": 10
  }'::jsonb, '{
    "custom_branding": true,
    "custom_prompt": true,
    "analytics": "extended",
    "choose_provider": true,
    "own_tg_bot": true
  }'::jsonb)
ON CONFLICT (id) DO NOTHING;
