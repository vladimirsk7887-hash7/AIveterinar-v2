-- ═══════════════════════════════════════════════════════════
-- AI-Ветеринар SaaS — Initial Migration
-- Version: 4.4
-- ═══════════════════════════════════════════════════════════

-- 1. ТАРИФЫ
CREATE TABLE plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_monthly_rub INT NOT NULL,
  limits JSONB NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. КЛИНИКИ (TENANTS)
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  address TEXT,

  plan_id TEXT REFERENCES plans(id) DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ DEFAULT now(),
  plan_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_active BOOLEAN DEFAULT true,

  balance_rub INT DEFAULT 0,

  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C4DFF',
  secondary_color TEXT DEFAULT '#448AFF',
  welcome_message TEXT,

  ai_provider TEXT DEFAULT 'routerai',
  ai_model TEXT DEFAULT 'gpt-5.2',
  custom_prompt TEXT,

  tg_chat_ids TEXT[] DEFAULT '{}',
  tg_bot_token_encrypted TEXT,

  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ДИАЛОГИ
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  session_id TEXT,
  external_user_id TEXT,
  pet_type TEXT NOT NULL,
  pet_name TEXT,
  status TEXT DEFAULT 'consultation',
  card JSONB DEFAULT '{}',
  source TEXT NOT NULL,
  fsm_state TEXT DEFAULT 'idle',
  fsm_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. СООБЩЕНИЯ
CREATE TABLE messages (
  id BIGSERIAL PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES clinics(id),
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  visible_text TEXT,
  meta JSONB,
  ai_provider TEXT,
  ai_model TEXT,
  tokens_input INT DEFAULT 0,
  tokens_output INT DEFAULT 0,
  cost_rub DECIMAL(10,4) DEFAULT 0,
  latency_ms INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. ЗАПИСИ НА ПРИЁМ
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  contact_method TEXT NOT NULL,
  contact_value TEXT NOT NULL,
  pet_card JSONB,
  summary TEXT,
  status TEXT DEFAULT 'new',
  tg_notification_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. УЧЁТ РАСХОДОВ API
CREATE TABLE api_usage (
  id BIGSERIAL PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  dialogs_count INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  tokens_input BIGINT DEFAULT 0,
  tokens_output BIGINT DEFAULT 0,
  tokens_reserved INT DEFAULT 0,
  cost_rub DECIMAL(12,4) DEFAULT 0,
  UNIQUE(clinic_id, month)
);

-- 7. ПЛАТЕЖИ
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_id TEXT,
  amount_rub INT NOT NULL,
  plan_id TEXT REFERENCES plans(id),
  period_months INT DEFAULT 1,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- 8. ЛОГ СОБЫТИЙ
CREATE TABLE events (
  id BIGSERIAL PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  actor TEXT,
  data JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- ИНДЕКСЫ
-- ═══════════════════════════════════════════════
CREATE INDEX idx_events_clinic_date ON events(clinic_id, created_at DESC);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_conversations_clinic ON conversations(clinic_id, created_at DESC);
CREATE INDEX idx_conversations_external ON conversations(clinic_id, source, external_user_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_api_usage_clinic_month ON api_usage(clinic_id, month);
CREATE INDEX idx_payments_clinic ON payments(clinic_id, created_at DESC);

-- ═══════════════════════════════════════════════
-- RPC-ФУНКЦИИ (Token Reservation + Billing)
-- ═══════════════════════════════════════════════

-- Шаг 4: Атомарная резервация токенов ДО вызова AI (с Upsert для нового месяца)
CREATE OR REPLACE FUNCTION reserve_tokens(
  p_clinic_id UUID,
  p_month DATE,
  p_max_expected INT,
  p_plan_dialogs_limit INT,
  p_hard_cap_rub INT,
  p_overage TEXT,
  p_tokens_included BIGINT
) RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_updated_id BIGINT;
BEGIN
  -- Upsert: создаём строку за новый месяц если не существует
  INSERT INTO api_usage (clinic_id, month)
  VALUES (p_clinic_id, p_month)
  ON CONFLICT (clinic_id, month) DO NOTHING;

  -- Атомарная резервация с проверкой лимитов
  UPDATE api_usage
  SET tokens_reserved = tokens_reserved + p_max_expected
  WHERE clinic_id = p_clinic_id
    AND month = p_month
    AND dialogs_count < p_plan_dialogs_limit
    AND (cost_rub < p_hard_cap_rub OR p_hard_cap_rub IS NULL)
    AND (
      CASE
        WHEN p_overage = 'block'
          THEN (tokens_input + tokens_output + tokens_reserved + p_max_expected) <= p_tokens_included
        ELSE true
      END
    )
  RETURNING id INTO v_updated_id;

  RETURN v_updated_id IS NOT NULL;
END;
$$;

-- Шаг 5 (ошибка): Откат резервации при сбое AI
CREATE OR REPLACE FUNCTION rollback_reservation(
  p_clinic_id UUID,
  p_month DATE,
  p_max_expected INT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_usage
  SET tokens_reserved = GREATEST(0, tokens_reserved - p_max_expected)
  WHERE clinic_id = p_clinic_id AND month = p_month;
END;
$$;

-- Шаг 6: Компенсация резерва + запись факта + списание с баланса
CREATE OR REPLACE FUNCTION commit_ai_usage(
  p_clinic_id UUID,
  p_month DATE,
  p_max_expected INT,
  p_actual_input INT,
  p_actual_output INT,
  p_actual_cost_rub DECIMAL,
  p_overage_cost_rub INT
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  UPDATE api_usage
  SET
    tokens_reserved = GREATEST(0, tokens_reserved - p_max_expected),
    messages_count = messages_count + 1,
    tokens_input = tokens_input + p_actual_input,
    tokens_output = tokens_output + p_actual_output,
    cost_rub = cost_rub + p_actual_cost_rub
  WHERE clinic_id = p_clinic_id AND month = p_month;

  IF p_overage_cost_rub > 0 THEN
    UPDATE clinics
    SET balance_rub = balance_rub - p_overage_cost_rub
    WHERE id = p_clinic_id;
  END IF;
END;
$$;

-- Garbage Collection: удаление старых логов
CREATE OR REPLACE FUNCTION gc_events(p_retention_days INT DEFAULT 90)
RETURNS INT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_deleted INT;
BEGIN
  DELETE FROM events
  WHERE created_at < NOW() - (p_retention_days || ' days')::interval;
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- ═══════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Clinics: только владелец через JWT
CREATE POLICY clinic_own ON clinics
  FOR ALL USING (auth_user_id = auth.uid());

-- Conversations: JWT владельца ИЛИ Custom JWT claim виджета
CREATE POLICY conversations_isolation ON conversations
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid())
    OR clinic_id = (nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'clinic_id', ''))::uuid
  );

CREATE POLICY messages_isolation ON messages
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid())
    OR clinic_id = (nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'clinic_id', ''))::uuid
  );

CREATE POLICY appointments_isolation ON appointments
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid())
    OR clinic_id = (nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'clinic_id', ''))::uuid
  );

CREATE POLICY usage_isolation ON api_usage
  FOR ALL USING (
    clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid())
    OR clinic_id = (nullif(current_setting('request.jwt.claims', true)::jsonb ->> 'clinic_id', ''))::uuid
  );

-- Payments и Events: только JWT (нет доступа из виджета)
CREATE POLICY payments_by_clinic ON payments
  FOR ALL USING (clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid()));

CREATE POLICY events_by_clinic ON events
  FOR ALL USING (clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid()));
