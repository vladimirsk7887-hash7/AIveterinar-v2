# Архитектура: AI-Ветеринар SaaS Platform

> Версия: 4.4 (Custom JWT, RPC + Upsert, GC, TG decrypt) | Дата: 2026-02-21
> Домен: aiveterinar.ru

---

## ИКР (Идеальный Конечный Результат)

Клиника может: зарегистрироваться → настроить бота → вставить виджет на сайт → получать заявки в Telegram → оплатить подписку.

| Критерий | Описание |
|---|---|
| **Форма** | Веб-платформа: лендинг + админ-панель + суперадмин + виджет-чат + TG Mini App |
| **Домен** | aiveterinar.ru |
| **Функции** | Мультитенантный чат, 3 AI-провайдера, 3 платёжных провайдера, FSM, Event Bus, аналитика, event log |
| **Готово когда** | Полный цикл: регистрация → настройка → виджет → заявки → оплата |

---

## Инфраструктура

```
VPS #1 (aiveterinar.ru)
  └─ Docker-контейнер: Express API + React (все frontends)
     └─ Деплоится через Coolify с VPS #2

VPS #2
  ├─ Coolify (PaaS) → деплоит на VPS #1 удалённо
  └─ Supabase (self-hosted)
     ├─ PostgreSQL 16
     ├─ Auth (email/password, magic links, сброс пароля)
     ├─ Storage (логотипы клиник)
     └─ Realtime (live updates в админке)
```

---

## Общая схема системы

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              КЛИЕНТЫ                                     │
│  ┌──────────┐  ┌────────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐ │
│  │ Лендинг  │  │  Админка   │  │ Суперадмин│  │  Виджет  │  │ TG App │ │
│  │ /        │  │ /admin/*   │  │ /super/*  │  │ (iframe) │  │ /tg/*  │ │
│  └────┬─────┘  └─────┬──────┘  └─────┬─────┘  └────┬─────┘  └───┬────┘ │
└───────┼──────────────┼───────────────┼─────────────┼─────────────┼──────┘
        │         Supabase SDK        │             │             │
        │         (Auth, CRUD)        │             │             │
        ▼              ▼               ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        EXPRESS API SERVER                                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  CONFIG LAYER                                                    │    │
│  │  config.yaml → providers, models, tariffs, payments, fsm, logs   │    │
│  │  .env       → secrets (API keys, DB URL, tokens)                 │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐    │
│  │  MIDDLEWARE CHAIN                                                │    │
│  │  cors → helmet → rateLimit → logger → requestId → tenant → auth  │    │
│  └──────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │  Widget  │ │  Clinic  │ │  Admin   │ │ Payment  │ │   Webhook    │  │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │ │   Routes     │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │            │            │            │               │          │
│  ┌────▼────────────▼────────────▼────────────▼───────────────▼───────┐  │
│  │                        SERVICE LAYER                              │  │
│  │                                                                   │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │              AI PROVIDER ROUTER                            │    │  │
│  │  │  ┌──────────┐  ┌────────────┐  ┌────────────────────┐    │    │  │
│  │  │  │ RouterAI │  │ OpenRouter │  │ OpenAI (fallback)  │    │    │  │
│  │  │  │ /api/v1  │  │ /api/v1   │  │ /v1                │    │    │  │
│  │  │  └──────────┘  └────────────┘  └────────────────────┘    │    │  │
│  │  │  Все OpenAI-compatible. Failover при ошибках.             │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │            PAYMENT PROVIDER ROUTER                        │    │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌────────────────────┐      │    │  │
│  │  │  │ YooKassa │  │  Stripe  │  │   TG Stars         │      │    │  │
│  │  │  │ (рубли)  │  │  (USD)   │  │   (встроенный)     │      │    │  │
│  │  │  └──────────┘  └──────────┘  └────────────────────┘      │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  ┌───────────────────────────────────────────────────────────┐    │  │
│  │  │              EVENT BUS (async, ТОЛЬКО побочные эффекты)    │    │  │
│  │  │                                                           │    │  │
│  │  │  ⚠ Лимиты и usage — СИНХРОННЫЕ (до AI call)              │    │  │
│  │  │  Event Bus — только для некритичных операций:              │    │  │
│  │  │                                                           │    │  │
│  │  │  appointment.new  → [logEvent, notifyTG, notifyAdmin]     │    │  │
│  │  │  payment.done     → [logEvent, activatePlan, notify]      │    │  │
│  │  │  clinic.register  → [logEvent, sendWelcome, defaults]     │    │  │
│  │  │  limit.reached    → [logEvent, notifyClinic]              │    │  │
│  │  │  error.*          → [logEvent, alertAdmin]                │    │  │
│  │  └───────────────────────────────────────────────────────────┘    │  │
│  │                                                                   │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │  │
│  │  │ Telegram │ │   FSM    │ │  Logger  │ │  Usage   │            │  │
│  │  │ Service  │ │  Engine  │ │  (pino)  │ │  Tracker │            │  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │  │
│  └───────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                      ┌──────────▼──────────┐
                      │  SUPABASE (VPS #2)  │
                      │  PostgreSQL + Auth  │
                      │  + Storage          │
                      │  + Realtime         │
                      └─────────────────────┘
```

---

## AI-провайдеры

Все — OpenAI-совместимый формат (`POST /chat/completions`).

| Провайдер | Base URL | Ключ (.env) | Роль |
|---|---|---|---|
| **RouterAI** | `routerai.ru/api/v1` | `AI__ROUTERAI_API_KEY` | Primary (по умолчанию) |
| **OpenRouter** | `openrouter.ai/api/v1` | `AI__OPENROUTER_API_KEY` | Secondary |
| **OpenAI** | `api.openai.com/v1` | `OPENAI_API_KEY` | Fallback |

### Модели (из config.yaml)

| Модель | Провайдер | Input ₽/1M | Output ₽/1M | Context |
|---|---|---|---|---|
| gpt-5.2 | RouterAI | 174 | 1396 | 400K |
| claude-sonnet-4-5 | RouterAI | 299 | 1496 | 1M |
| deepseek-v3.2 | RouterAI | 25 | 37 | 164K |
| openai/gpt-4o | OpenRouter | ~225 | ~900 | 128K |
| gpt-4o | OpenAI | ~225 | ~900 | 128K |

### Failover логика
```
1. Попробовать provider клиники (ai_provider в clinics)
2. Если ошибка 5xx/timeout → попробовать следующий enabled provider
3. Если все провайдеры failed → вернуть ошибку + event error.ai_provider
```

---

## Платёжные провайдеры

| Провайдер | Валюта | Для кого | Webhook |
|---|---|---|---|
| **YooKassa** | RUB | Российские клиники | `/api/webhooks/yookassa` |
| **Stripe** | USD/EUR | Международные | `/api/webhooks/stripe` |
| **TG Stars** | Stars | Оплата через Telegram | Bot API (нет webhook) |

### Тарифные планы

| | Пробный | Старт | Бизнес | Про |
|---|---|---|---|---|
| **Цена** | 0 ₽ (7 дней) | 2 990 ₽/мес | 5 990 ₽/мес | 9 990 ₽/мес |
| **Диалогов** | 20/мес | 100/мес | 500/мес | 2 000/мес |
| **Токенов включено** | 500K | 2M | 10M | 50M |
| **Сверх лимита токенов** | Блокировка | Блокировка | 3 ₽/1K токенов | 1.5 ₽/1K токенов |
| **Hard cap (аварийный)** | — | — | 30 000 ₽/мес | 100 000 ₽/мес |
| **Сообщений/диалог** | 30 | 50 | 100 | 200 |
| **TG чатов** | 1 | 1 | 3 | 10 |
| **Виджетов** | 1 | 1 | 3 | 10 |
| **Брендинг** | — | Название | + Лого + цвета | + Кастом промпт |
| **Аналитика** | Базовая | Базовая | Расширенная | + Экспорт |
| **AI-провайдер** | RouterAI | RouterAI | Выбор | Выбор + свой бот TG |

> **Экономика защищена (Prepaid Balance):**
> - Тарифы "Пробный" и "Старт": при исчерпании `tokens_included` → виджет блокируется до следующего месяца.
> - Тарифы "Бизнес" и "Про": overage списывается **с авансового баланса** (`clinics.balance_rub`).
> - Клиника пополняет баланс заранее через YooKassa/Stripe (`POST /api/payments/topup`).
> - Когда `balance_rub` ≤ 0 → виджет блокируется до пополнения (платформа **не кредитует** клиентов).
> - `hard_cap_rub` — дополнительный аварийный лимит: даже при положительном балансе, если расходы за месяц >= hard_cap → блокировка.
> - При достижении лимита — виджет показывает "Позвоните нам напрямую".

---

## FSM (Машина состояний диалогов)

### Состояния

```
idle → pet_selected → chatting → appointment_form → appointment_sent → completed
                  ↑       │
                  └───────┘ (продолжение чата)
```

### Хранилища

| Storage | Когда использовать | Персистентность |
|---|---|---|
| **memory** | Локальная разработка / тесты | Нет (теряется при рестарте) |
| **postgres** | Production (по умолчанию) | Да (conversations.fsm_state + fsm_data) |
| **redis** | Масштабирование / кэш поверх PG | Да |

> **Важно:** SQLite убран из FSM-хранилищ. Docker-контейнеры эфемерны — файл SQLite уничтожается при редеплое. Вместо этого FSM-состояние хранится непосредственно в PostgreSQL (таблица `conversations`), что гарантирует персистентность при любых перезапусках.

Конфиг в `config.yaml`:
```yaml
fsm:
  storage: "postgres"   # memory | postgres | redis
  redis:
    url: ""
```

---

## Event Bus (асинхронная обработка)

### Архитектура

```
Action → emit(eventType, data) → [listener1, listener2, ...]
                                    ↓ async (не блокирует ответ)
                                    logEvent()
                                    trackUsage()
                                    checkLimits()
                                    notifyTelegram()
```

### Отслеживаемые события

| Событие | Listeners |
|---|---|
| `clinic.registered` | logEvent, sendWelcomeEmail, createDefaults |
| `clinic.settings_updated` | logEvent |
| `conversation.started` | logEvent, incrementUsage |
| `conversation.completed` | logEvent |
| `message.sent` | logEvent, trackTokens, checkDialogLimit |
| `message.received` | logEvent |
| `appointment.created` | logEvent, notifyTG, notifyAdmin |
| `appointment.status_changed` | logEvent |
| `payment.initiated` | logEvent |
| `payment.completed` | logEvent, activatePlan, notifyAdmin |
| `payment.failed` | logEvent, notifyClinic |
| `widget.loaded` | logEvent (analytics) |
| `widget.chat_opened` | logEvent (analytics) |
| `limit.reached` | logEvent, notifyClinic, blockWidget |
| `error.ai_provider` | logEvent, alertAdmin, tryFailover |
| `error.telegram` | logEvent, alertAdmin |
| `error.payment` | logEvent, alertAdmin |

---

## Модель доступа к данным (двухуровневая, RLS везде)

### Проблема
RLS-политики Supabase требуют `auth.uid()`, а посетители виджета — анонимны. Использование `service_role` key полностью отключает RLS — любая ошибка в коде Express может привести к утечке персональных данных между клиниками.

### Решение: Custom JWT Claims (для stateless PostgREST)

> **Почему НЕ `set_config()`:** Supabase REST API (PostgREST) — stateless. Каждый запрос выполняется в отдельной транзакции. Вызов `set_config('app.current_clinic_id', ...)` установит переменную и *немедленно закроет транзакцию*. Следующий `.from('messages').insert(...)` пройдёт в новой транзакции, где переменная пуста → RLS заблокирует запрос.

```
┌─────────────────────────────────────────────────────────────┐
│  АДМИН-ПАНЕЛЬ (клиника)                                      │
│  Supabase JS SDK (browser) → anon key + JWT пользователя     │
│  → RLS проверяет: auth_user_id = auth.uid()                  │
│  → Клиника видит только свои данные                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  WIDGET API + TG WEBHOOK (Express, серверный)                │
│  → Tenant middleware: определяет clinic_id из slug            │
│  → Подписывает Custom JWT (5 мин TTL) с claim {clinic_id}    │
│  → Создаёт per-request Supabase client с этим JWT            │
│  → RLS проверяет: jwt.claims ->> 'clinic_id'                 │
│  → БД физически не отдаст данные другой клиники,              │
│    даже при ошибке в SQL-запросе Express                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  SUPERADMIN (Express, серверный)                              │
│  Supabase service_role key (единственный потребитель!)        │
│  → Только для routes/admin.js (суперадмин-панель)            │
│  → Защищён middleware: superadmin.js (проверка email из .env) │
└─────────────────────────────────────────────────────────────┘
```

**Принцип:** RLS защищает данные на уровне СУБД для ВСЕХ клиентов. Виджет работает через `anon key` + Custom JWT с `clinic_id` в claims — PostgREST передаёт claims в каждой транзакции автоматически. `service_role` — ТОЛЬКО для суперадмина.

### RLS-политики (двойная проверка: auth.uid ИЛИ JWT claim)

```sql
-- Универсальная RLS-политика: работает и для админки, и для виджета
CREATE POLICY conversations_isolation ON conversations
  FOR ALL USING (
    -- Условие 1: Доступ из админ-панели (JWT владельца клиники)
    clinic_id IN (SELECT id FROM clinics WHERE auth_user_id = auth.uid())
    OR
    -- Условие 2: Доступ из виджета/webhook (кастомный JWT с clinic_id)
    clinic_id = (
      nullif(
        current_setting('request.jwt.claims', true)::jsonb ->> 'clinic_id',
        ''
      )
    )::uuid
  );
```

### Tenant middleware (Express) — Custom JWT

```js
// middleware/tenant.js
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Админ-клиент: ТОЛЬКО для lookup клиники по slug (1 SELECT)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

export async function tenantMiddleware(req, res, next) {
  const { slug } = req.params;

  // 1. Находим клинику (через service_role — единственный SELECT)
  const { data: clinic } = await supabaseAdmin
    .from('clinics')
    .select('id, is_active, plan_id, ai_provider, ai_model, balance_rub')
    .eq('slug', slug)
    .single();

  if (!clinic || !clinic.is_active) {
    return res.status(404).json({ error: 'Clinic not found' });
  }

  // 2. Подписываем Custom JWT (5 мин TTL) с clinic_id в claims
  const customToken = jwt.sign(
    {
      role: 'authenticated',
      clinic_id: clinic.id,         // ← RLS читает этот claim
      exp: Math.floor(Date.now() / 1000) + 300
    },
    process.env.SUPABASE_JWT_SECRET  // JWT Secret из Supabase Dashboard → API Settings
  );

  // 3. Per-request Supabase client с Custom JWT
  req.supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    { global: { headers: { Authorization: `Bearer ${customToken}` } } }
  );

  req.clinic = clinic;
  next();
}
```

> **Безопасность:** Custom JWT подписан тем же секретом, что и Supabase Auth. PostgREST проверяет подпись и передаёт claims в `request.jwt.claims` — доступно в RLS-политиках. Каждый запрос к БД автоматически ограничен clinic_id из JWT. Утечка данных между клиниками невозможна даже при ошибке в Express-контроллере.

---

## Поток обработки Widget-запроса (критический путь)

```
POST /api/widget/:slug/chat
  │
  ├─ 1. CORS check (origin из настроек клиники)
  ├─ 2. Rate limiter (10 req/min per IP per slug)
  ├─ 3. Tenant middleware → req.clinic из slug
  │     → lookup через service_role (единственный SELECT)
  │     → подписывает Custom JWT с clinic_id
  │     → создаёт req.supabase (per-request client)
  │     → если не найдена или is_active=false → 404
  │
  ├─ 4. ★ АТОМАРНАЯ РЕЗЕРВАЦИЯ (RPC: reserve_tokens) ★
  │     const reserved = await req.supabase.rpc('reserve_tokens', {
  │       p_clinic_id, p_month, p_max_expected,
  │       p_plan_dialogs_limit, p_hard_cap_rub,
  │       p_overage, p_tokens_included
  │     });
  │     → если false → 429 (лимит исчерпан)
  │     → если overage='charge' И balance_rub < estimated → 429
  │
  ├─ 5. AI Provider call (RouterAI/OpenRouter/OpenAI)
  │     → failover при 5xx/timeout
  │     → возвращает: text, tokens_input, tokens_output, latency_ms
  │     → при ошибке: rpc('rollback_reservation', {p_clinic_id, p_month, p_max_expected})
  │
  ├─ 6. ★ КОМПЕНСАЦИЯ + БИЛЛИНГ (RPC: commit_ai_usage) ★
  │     await req.supabase.rpc('commit_ai_usage', {
  │       p_clinic_id, p_month, p_max_expected,
  │       p_actual_input, p_actual_output,
  │       p_actual_cost_rub, p_overage_cost_rub
  │     });
  │     → снимает резерв, записывает факт, списывает с баланса
  │
  ├─ 7. INSERT message в БД (через req.supabase, RLS по JWT claim)
  │
  ├─ 8. Ответ клиенту: {text, meta, suggestions}
  │
  └─ 9. Event Bus (async, НЕ блокирует ответ)
        → logEvent('message.sent', {...})
        → если status=red → notifyTG(clinic.tg_chat_ids, 'ЭКСТРЕННО')
        → если balance_rub < порог → emit('limit.approaching')
```

> **Критично:** шаги 4 и 6 — вызовы RPC-функций PostgreSQL (Stored Procedures). Supabase REST API не поддерживает сложные условные UPDATE — только `.rpc()`. Каждая RPC-функция выполняется в одной транзакции с row-level lock, что сериализует параллельные запросы и полностью устраняет TOCTOU Race Condition.

---

## Telegram Multi-Bot Routing

### Тарифы Старт/Бизнес: единый бот платформы

```
Платформенный бот (TG_BOT_TOKEN из .env)
  → клиника добавляет бота в свою TG-группу
  → клиника указывает tg_chat_ids[] в настройках
  → при appointment/экстренном статусе: sendMessage → chat_id клиники
  → ВХОДЯЩИХ вебхуков от клиентских ботов НЕТ
```

### Тариф Про: свой бот клиники

```
Клиника создаёт бота через @BotFather → вводит токен в настройках
  → Платформа вызывает: setWebhook(url: aiveterinar.ru/api/tg-webhook/{slug})
  → Telegram пушит обновления на: POST /api/tg-webhook/:slug
  → Express tenant middleware → обработка входящего сообщения
  → Никакого long polling. Один HTTP endpoint на все боты.
```

**Маршрутизация:**
```
POST /api/tg-webhook/:slug
  ├─ tenant middleware → req.clinic (включая tg_bot_token_encrypted)
  ├─ decrypt tg_bot_token (AES-256-GCM, ENCRYPTION_KEY из .env)
  │   → req.clinic.tg_bot_token = decrypt(tg_bot_token_encrypted)
  ├─ verify webhook signature (из X-Telegram-Bot-Api-Secret-Token)
  ├─ parse update → extract message/callback
  └─ route to chat handler (как обычный widget message)
```

**Шифрование TG-токенов (AES-256-GCM):**
```js
// services/crypto.js
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const KEY = Buffer.from(process.env.ENCRYPTION_KEY, 'hex'); // 32 bytes

export function encrypt(text) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', KEY, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
}

export function decrypt(stored) {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  const decipher = createDecipheriv('aes-256-gcm', KEY, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return decipher.update(Buffer.from(dataB64, 'base64'), null, 'utf8') + decipher.final('utf8');
}
```

**Масштабирование:** при 100 клиниках = ~100-1000 req/day от Telegram. Express легко обрабатывает.

---

## Схема базы данных (8 таблиц)

```sql
-- ═══════════════════════════════════════════════
-- 1. ТАРИФЫ
-- ═══════════════════════════════════════════════
CREATE TABLE plans (
  id TEXT PRIMARY KEY,                -- 'trial', 'start', 'business', 'pro'
  name TEXT NOT NULL,
  price_monthly_rub INT NOT NULL,     -- копейки
  limits JSONB NOT NULL,
  features JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 2. КЛИНИКИ (TENANTS)
-- ═══════════════════════════════════════════════
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Основное
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  address TEXT,

  -- Подписка
  plan_id TEXT REFERENCES plans(id) DEFAULT 'trial',
  plan_started_at TIMESTAMPTZ DEFAULT now(),
  plan_expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days'),
  is_active BOOLEAN DEFAULT true,

  -- Баланс (Prepaid Wallet, в копейках)
  balance_rub INT DEFAULT 0,

  -- Брендинг
  logo_url TEXT,
  primary_color TEXT DEFAULT '#7C4DFF',
  secondary_color TEXT DEFAULT '#448AFF',
  welcome_message TEXT,

  -- AI
  ai_provider TEXT DEFAULT 'routerai',
  ai_model TEXT DEFAULT 'gpt-5.2',
  custom_prompt TEXT,

  -- Telegram
  tg_chat_ids TEXT[] DEFAULT '{}',
  tg_bot_token_encrypted TEXT,

  -- Метаданные
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 3. ДИАЛОГИ
-- ═══════════════════════════════════════════════
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  session_id TEXT,
  external_user_id TEXT,              -- универсальный: TG user ID, WhatsApp номер, UUID виджета и т.д.
  pet_type TEXT NOT NULL,
  pet_name TEXT,
  status TEXT DEFAULT 'consultation',
  card JSONB DEFAULT '{}',
  source TEXT NOT NULL,               -- 'widget', 'telegram', 'web'
  fsm_state TEXT DEFAULT 'idle',
  fsm_data JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  message_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════
-- 4. СООБЩЕНИЯ
-- ═══════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════
-- 5. ЗАПИСИ НА ПРИЁМ
-- ═══════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════
-- 6. УЧЁТ РАСХОДОВ API
-- ═══════════════════════════════════════════════
CREATE TABLE api_usage (
  id BIGSERIAL PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  dialogs_count INT DEFAULT 0,
  messages_count INT DEFAULT 0,
  tokens_input BIGINT DEFAULT 0,
  tokens_output BIGINT DEFAULT 0,
  tokens_reserved INT DEFAULT 0,       -- ★ зарезервированные токены (Token Reservation Pattern)
  cost_rub DECIMAL(12,4) DEFAULT 0,
  UNIQUE(clinic_id, month)
);

-- ═══════════════════════════════════════════════
-- 7. ПЛАТЕЖИ
-- ═══════════════════════════════════════════════
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

-- ═══════════════════════════════════════════════
-- 8. ЛОГ СОБЫТИЙ
-- ═══════════════════════════════════════════════
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

-- Индексы
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
  -- ★ Upsert: создаём строку за новый месяц если не существует
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
  p_overage_cost_rub INT    -- сумма к списанию с баланса (копейки), 0 если нет overage
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  -- 1. Снимаем резерв и записываем фактическое потребление
  UPDATE api_usage
  SET
    tokens_reserved = GREATEST(0, tokens_reserved - p_max_expected),
    messages_count = messages_count + 1,
    tokens_input = tokens_input + p_actual_input,
    tokens_output = tokens_output + p_actual_output,
    cost_rub = cost_rub + p_actual_cost_rub
  WHERE clinic_id = p_clinic_id AND month = p_month;

  -- 2. Списываем с авансового баланса при overage
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

-- Шифрование/дешифровка TG bot tokens (AES-256-GCM)
-- Шифрование выполняется в Node.js (crypto), а не в PostgreSQL.
-- В БД хранится: iv:authTag:ciphertext (base64).
-- Дешифровка: middleware/tenant.js при обработке TG webhook.

-- RLS (двойная проверка: JWT для админки + Custom JWT claim для виджета)
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

-- Все остальные таблицы: JWT владельца ИЛИ Custom JWT claim виджета
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
```

---

## API эндпоинты

### Widget (public, по slug)
```
GET  /api/widget/:slug/config          Конфиг клиники (брендинг)
POST /api/widget/:slug/chat            Отправка сообщения
POST /api/widget/:slug/appointment     Запись на приём
```

### Clinic (JWT protected, clinic_admin)
```
GET    /api/clinic                     Профиль клиники
PUT    /api/clinic                     Обновить настройки
PUT    /api/clinic/branding            Обновить брендинг (+ upload logo)
GET    /api/clinic/widget-code         Получить код виджета
GET    /api/clinic/conversations       Список диалогов
GET    /api/clinic/conversations/:id   Детали диалога
GET    /api/clinic/appointments        Список заявок
PUT    /api/clinic/appointments/:id    Обновить статус
GET    /api/clinic/analytics           Аналитика
GET    /api/clinic/usage               API usage
GET    /api/clinic/events              Лог событий
```

### Payments
```
POST   /api/payments/create            Создать платёж (подписка)
POST   /api/payments/topup             Пополнить баланс (Prepaid Wallet)
GET    /api/payments/status/:id        Статус платежа
GET    /api/payments/balance           Текущий баланс клиники
POST   /api/webhooks/yookassa          YooKassa callback
POST   /api/webhooks/stripe            Stripe callback
```

### Auth
```
POST   /api/auth/register              Регистрация клиники
POST   /api/auth/login                 Логин → JWT
POST   /api/auth/logout                Логаут
POST   /api/auth/reset-password        Сброс пароля
GET    /api/auth/me                    Текущий пользователь
```

### Superadmin (role: superadmin)
```
GET    /api/admin/clinics              Все клиники
GET    /api/admin/clinics/:id          Детали клиники
PUT    /api/admin/clinics/:id          Управление (block/unblock/change plan)
GET    /api/admin/stats                Общая статистика
GET    /api/admin/events               Все события
GET    /api/admin/payments             Все платежи
```

### Telegram Webhook (Про: свой бот)
```
POST   /api/tg-webhook/:slug           Входящие от TG бота клиники
```

### System
```
GET    /api/health                     Healthcheck + stats
```

### Legacy (TG Mini App, backward compat)
```
POST   /api/chat                       OpenAI proxy
POST   /api/telegram                   TG send
POST   /api/validate-tg                initData check
```

---

## config.yaml

```yaml
# ═══════════════════════════════════════════════════════════
# AI-ВЕТЕРИНАР SaaS — КОНФИГУРАЦИЯ ПЛАТФОРМЫ
# ═══════════════════════════════════════════════════════════

platform:
  name: "AI-Ветеринар"
  url: "https://aiveterinar.ru"
  support_email: "support@aiveterinar.ru"

# ─── AI ПРОВАЙДЕРЫ ───────────────────────────────────────
ai:
  default_provider: "routerai"
  default_model: "gpt-5.2"
  max_completion_tokens: 1000

  providers:
    routerai:
      enabled: true
      base_url: "https://routerai.ru/api/v1"
      models:
        - id: "gpt-5.2"
          name: "GPT-5.2"
          input_cost_rub: 174
          output_cost_rub: 1396
        - id: "claude-sonnet-4-5-20250929"
          name: "Claude Sonnet 4.5"
          input_cost_rub: 299
          output_cost_rub: 1496
        - id: "deepseek/deepseek-chat-v3-0324"
          name: "DeepSeek V3.2"
          input_cost_rub: 25
          output_cost_rub: 37

    openrouter:
      enabled: false
      base_url: "https://openrouter.ai/api/v1"
      proxy: ""
      models:
        - id: "openai/gpt-4o"
          name: "GPT-4o (OpenRouter)"
          input_cost_usd: 0.0025
          output_cost_usd: 0.01

    openai:
      enabled: false
      base_url: "https://api.openai.com/v1"
      models:
        - id: "gpt-4o"
          name: "GPT-4o (Direct)"
          input_cost_usd: 0.0025
          output_cost_usd: 0.01

# ─── ТАРИФЫ ──────────────────────────────────────────────
tariffs:
  - id: "trial"
    name: "Пробный"
    price_monthly_rub: 0
    duration_days: 7
    limits:
      dialogs_per_month: 20
      messages_per_dialog: 30
      tokens_included: 500000       # 500K токенов
      overage: "block"              # при исчерпании — блокировка
      tg_chats: 1
      widgets: 1
    features:
      custom_branding: false
      custom_prompt: false
      analytics: "basic"
      choose_provider: false

  - id: "start"
    name: "Старт"
    price_monthly_rub: 299000
    limits:
      dialogs_per_month: 100
      messages_per_dialog: 50
      tokens_included: 2000000      # 2M токенов
      overage: "block"              # при исчерпании — блокировка
      tg_chats: 1
      widgets: 1
    features:
      custom_branding: true
      custom_prompt: false
      analytics: "basic"
      choose_provider: false

  - id: "business"
    name: "Бизнес"
    price_monthly_rub: 599000
    limits:
      dialogs_per_month: 500
      messages_per_dialog: 100
      tokens_included: 10000000     # 10M токенов
      overage: "charge"             # сверх лимита — доплата
      overage_cost_per_1k_rub: 3    # 3₽ за 1K токенов сверху
      hard_cap_rub: 3000000         # 30 000₽ макс/мес (в копейках)
      tg_chats: 3
      widgets: 3
    features:
      custom_branding: true
      custom_prompt: true
      analytics: "extended"
      choose_provider: true

  - id: "pro"
    name: "Про"
    price_monthly_rub: 999000
    limits:
      dialogs_per_month: 2000
      messages_per_dialog: 200
      tokens_included: 50000000     # 50M токенов
      overage: "charge"
      overage_cost_per_1k_rub: 1.5  # 1.5₽ за 1K токенов сверху
      hard_cap_rub: 10000000        # 100 000₽ макс/мес (в копейках)
      tg_chats: 10
      widgets: 10
    features:
      custom_branding: true
      custom_prompt: true
      analytics: "extended"
      choose_provider: true
      own_tg_bot: true

# ─── ПЛАТЕЖИ ─────────────────────────────────────────────
payments:
  tg_stars:
    enabled: false
    star_to_rub: 1.7

  yookassa:
    enabled: false
    webhook_path: "/api/webhooks/yookassa"
    return_url: "https://aiveterinar.ru/admin/billing"

  stripe:
    enabled: false
    webhook_path: "/api/webhooks/stripe"

# ─── FSM ─────────────────────────────────────────────────
fsm:
  storage: "postgres"    # memory | postgres | redis
  redis:
    url: ""              # только при storage: redis

# ─── ЛОГИРОВАНИЕ ─────────────────────────────────────────
logging:
  level: "info"
  format: "json"
  events:
    log_to_db: true
    retention_days: 90
  tracked_events:
    - "clinic.registered"
    - "clinic.settings_updated"
    - "conversation.started"
    - "conversation.completed"
    - "message.sent"
    - "message.received"
    - "appointment.created"
    - "appointment.status_changed"
    - "payment.initiated"
    - "payment.completed"
    - "payment.failed"
    - "widget.loaded"
    - "widget.chat_opened"
    - "limit.reached"
    - "error.ai_provider"
    - "error.telegram"
    - "error.payment"
  gc:
    enabled: true
    cron: "0 3 * * *"             # каждый день в 03:00
    # DELETE FROM events WHERE created_at < NOW() - INTERVAL '$retention_days days'

# ─── TELEGRAM ─────────────────────────────────────────────
telegram:
  message_max_length: 4000
  parse_mode: "HTML"
```

---

## .env.example

```bash
# Server
PORT=3000
NODE_ENV=production

# Supabase
SUPABASE_URL=https://your-supabase.example.com
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# AI providers (минимум ОДИН обязателен)
AI__ROUTERAI_API_KEY=sk-...
# AI__OPENROUTER_API_KEY=sk-or-v1-...
# OPENAI_API_KEY=sk-...

# Telegram
TG_BOT_TOKEN=123456:ABC...
TG_CHAT_ID=-5263363292

# Payments
# PAYMENTS__YOOKASSA__SHOP_ID=123456
# PAYMENTS__YOOKASSA__SECRET_KEY=live_...
# PAYMENTS__STRIPE__SECRET_KEY=sk_live_...
# PAYMENTS__STRIPE__WEBHOOK_SECRET=whsec_...

# FSM
FSM_STORAGE=postgres
# FSM_REDIS_URL=redis://localhost:6379

# Security
SUPABASE_JWT_SECRET=your-supabase-jwt-secret   # Supabase Dashboard → API Settings → JWT Secret
ENCRYPTION_KEY=32-byte-hex-for-tg-tokens

# Logging
LOG_LEVEL=info

# Superadmin
SUPERADMIN_EMAIL=admin@aiveterinar.ru
```

---

## Файловая структура

```
app/
├── server.js                          # Express entry
├── config.yaml                        # Конфигурация платформы
├── .env.example                       # Шаблон секретов
├── Dockerfile                         # Multi-stage build
├── docker-compose.yml                 # App + optional Redis
├── nginx.conf                         # Reverse proxy
├── backup.sh                          # pg_dump скрипт
├── package.json
├── vite.config.js                     # 5 entries
│
├── config/
│   ├── loader.js                      # Parse YAML + .env + validate
│   ├── schema.js                      # Zod validation schema
│   └── defaults.js                    # Default values
│
├── db/
│   ├── supabase.js                    # Supabase clients (anon + service_role только для superadmin)
│   └── migrations/
│       ├── 001_initial.sql            # All tables
│       └── 002_seed.sql               # Plans + superadmin
│
├── providers/
│   ├── ai/
│   │   ├── router.js                  # AI Provider Router + failover
│   │   ├── routerai.js                # RouterAI implementation
│   │   ├── openrouter.js              # OpenRouter implementation
│   │   └── openai.js                  # OpenAI implementation
│   │
│   └── payments/
│       ├── router.js                  # Payment Provider Router
│       ├── yookassa.js                # YooKassa
│       ├── stripe.js                  # Stripe
│       └── tg-stars.js                # TG Stars
│
├── services/
│   ├── ai.js                          # AI call + usage tracking
│   ├── telegram.js                    # TG notifications per-clinic
│   ├── fsm.js                         # FSM Engine
│   ├── fsm-stores/
│   │   ├── memory.js                  # MemoryStorage (dev/tests)
│   │   ├── postgres.js                # PostgresStorage (production, conversations table)
│   │   └── redis.js                   # RedisStorage (scale, cache over PG)
│   ├── events.js                      # Event Bus (async EventEmitter)
│   ├── logger.js                      # Pino structured logging
│   ├── usage.js                       # API usage tracking
│   ├── crypto.js                      # AES-256-GCM encrypt/decrypt (TG tokens)
│   ├── gc.js                          # Garbage Collection cron (events cleanup)
│   └── analytics.js                   # Analytics aggregation
│
├── middleware/
│   ├── auth.js                        # Supabase JWT verification
│   ├── superadmin.js                  # Superadmin role check
│   ├── tenant.js                      # Clinic from slug/JWT → req.clinic
│   ├── rateLimit.js                   # Per-clinic rate limiting
│   ├── requestId.js                   # UUID per request
│   └── logger.js                      # Request/response logging
│
├── routes/
│   ├── auth.js                        # /api/auth/*
│   ├── widget.js                      # /api/widget/:slug/*
│   ├── clinic.js                      # /api/clinic/*
│   ├── payments.js                    # /api/payments/*
│   ├── webhooks.js                    # /api/webhooks/*
│   ├── admin.js                       # /api/admin/* (superadmin)
│   ├── tg-webhook.js                  # /api/tg-webhook/:slug (Про: свой бот)
│   ├── health.js                      # /api/health
│   └── legacy.js                      # /api/chat, /api/telegram
│
├── src/
│   ├── landing/                       # Лендинг
│   │   ├── main.jsx
│   │   ├── LandingApp.jsx
│   │   ├── landing.css
│   │   └── sections/
│   │       ├── Hero.jsx
│   │       ├── Features.jsx
│   │       ├── HowItWorks.jsx
│   │       ├── Pricing.jsx
│   │       ├── Demo.jsx
│   │       └── Footer.jsx
│   │
│   ├── admin/                         # Админ-панель клиники
│   │   ├── main.jsx
│   │   ├── AdminApp.jsx
│   │   ├── admin.css
│   │   ├── lib/
│   │   │   ├── supabase.js
│   │   │   └── api.js
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Register.jsx
│   │       ├── Dashboard.jsx
│   │       ├── Settings.jsx
│   │       ├── Conversations.jsx
│   │       ├── ConversationDetail.jsx
│   │       ├── Appointments.jsx
│   │       ├── WidgetSetup.jsx
│   │       ├── Billing.jsx
│   │       └── EventLog.jsx
│   │
│   ├── superadmin/                    # Суперадмин
│   │   ├── main.jsx
│   │   ├── SuperApp.jsx
│   │   └── pages/
│   │       ├── ClinicsList.jsx
│   │       ├── ClinicDetail.jsx
│   │       ├── Stats.jsx
│   │       ├── AllPayments.jsx
│   │       └── AllEvents.jsx
│   │
│   ├── widget/                        # Виджет-чат
│   │   ├── widget-loader.js           # Vanilla JS ~5KB
│   │   ├── main.jsx
│   │   ├── WidgetApp.jsx
│   │   └── widget.css
│   │
│   ├── lib/                           # Shared
│   │   ├── ai.js
│   │   ├── telegram.js
│   │   └── constants.js
│   │
│   ├── components/                    # Shared UI
│   │   ├── AnimalSVG.jsx
│   │   ├── StatusBar.jsx
│   │   ├── PatientCard.jsx
│   │   ├── ChatMessage.jsx
│   │   ├── SuggestionButtons.jsx
│   │   └── AppointmentModal.jsx
│   │
│   └── tg-mini-app/                   # TG Mini App (без изменений)
│       ├── main.jsx
│       ├── TgApp.jsx
│       ├── tg-app.css
│       ├── hooks/useTelegram.js
│       └── screens/
│           ├── PetSelect.jsx
│           ├── Chat.jsx
│           └── Appointment.jsx
│
├── index.html                         # Лендинг
├── admin.html                         # Админ-панель
├── superadmin.html                    # Суперадмин
├── widget.html                        # Виджет iframe
└── tg-mini-app.html                   # TG Mini App
```

---

## Стек

| Компонент | Инструмент | Почему |
|---|---|---|
| Runtime | Node.js 20 | Уже используется |
| Backend | Express 5 | Уже в проекте |
| DB | PostgreSQL 16 (Supabase) | RLS, JSONB, Auth, Storage |
| Auth | Supabase Auth | email, magic links, reset |
| Storage | Supabase Storage | Логотипы |
| AI #1 | RouterAI | РФ, дешёвый, OpenAI-compat |
| AI #2 | OpenRouter | 100+ моделей |
| AI #3 | OpenAI | Fallback |
| Payments #1 | YooKassa | Рубли, ИП/ООО |
| Payments #2 | Stripe | USD/EUR |
| Payments #3 | TG Stars | Встроенный в Telegram |
| Frontend | React 19 + Vite 7 | Уже в проекте |
| Widget loader | Vanilla JS | ~5KB |
| FSM storage | PostgreSQL / Redis | Персистентность |
| Event Bus | EventEmitter | Async side effects |
| Logging | Pino | JSON, быстрый |
| Config | YAML + .env | Настройки + секреты |
| Deploy | Docker + Coolify | Git → auto deploy |

---

## Зависимости (новые)

```
Production:
  @supabase/supabase-js    Supabase SDK
  jsonwebtoken             Custom JWT для виджета (RLS через claims)
  yaml                     config.yaml parsing
  zod                      Config validation
  pino + pino-pretty       Logging
  express-rate-limit       Rate limiting
  helmet                   Security headers
  cors                     CORS per-clinic
  node-cron                GC scheduler (events cleanup)
  # FSM хранит состояния в PostgreSQL (conversations table)
  uuid                     Request IDs

Optional (подключаются при включении):
  ioredis                  FSM Redis storage
  stripe                   Stripe SDK
```

---

## Порядок реализации (11 фаз)

### Фаза 1: Каркас (Config + DB + Server)
config/ + db/ + server.js рефакторинг + .env.example + config.yaml

### Фаза 2: AI Provider Router
providers/ai/ — RouterAI + OpenRouter + OpenAI + failover

### Фаза 3: Event Bus + Logger + Usage Tracker
services/events.js + logger.js + usage.js

### Фаза 4: FSM Engine
services/fsm.js + fsm-stores/ (memory + postgres + redis)

### Фаза 5: Middleware + Widget API
middleware/ + routes/widget.js

### Фаза 6: Payment Providers
providers/payments/ + routes/payments.js + routes/webhooks.js

### Фаза 7: Auth + Clinic API
routes/auth.js + routes/clinic.js

### Фаза 8: Админ-панель (React)
src/admin/ — 10 страниц

### Фаза 9: Суперадмин
src/superadmin/ + routes/admin.js — 5 страниц

### Фаза 10: Виджет + Лендинг
src/widget/ + src/landing/

### Фаза 11: Docker + Deploy
Dockerfile + Coolify config + nginx + backup.sh

---

## Безопасность

- API ключи только в .env
- **RLS на уровне СУБД для ВСЕХ клиентов** (не только админка)
- Виджет: `anon key` + Custom JWT с `clinic_id` в claims → RLS изоляция на уровне БД
- **RPC-функции** (SECURITY DEFINER) для Token Reservation и Billing — атомарные транзакции
- `service_role` key — ТОЛЬКО для суперадмин-эндпоинтов (routes/admin.js)
- JWT verification через Supabase Auth
- **Token Reservation Pattern** — атомарная резервация предотвращает TOCTOU race condition
- **Prepaid Balance** — платформа не кредитует клиентов; overage списывается с авансового баланса
- Rate limiting per-clinic (10 req/min per IP per slug)
- Helmet security headers
- CORS per-clinic widget origins
- TG bot tokens зашифрованы (ENCRYPTION_KEY)
- Request ID для трейсинга
- Superadmin по email из .env (SUPERADMIN_EMAIL)
- Webhook signature verification (YooKassa, Stripe, Telegram)

---

## Legacy: Telegram Mini App

Сохраняется без изменений как демо-версия:
- Entry: `/tg/` → `tg-mini-app.html`
- Использует глобальные env vars (не мультитенантный)
- Роуты: `/api/chat`, `/api/telegram`, `/api/validate-tg`
