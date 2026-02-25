# AI-Ветеринар SaaS

SaaS-платформа для ветеринарных клиник. AI-ассистент принимает обращения 24/7, проводит триаж, собирает анамнез и записывает на приём.

## Стек

- **Frontend**: React 19 + Vite 7 (6 entry-points: landing, admin, superadmin, widget, main, tg)
- **Backend**: Express 5 + Node.js 20
- **AI**: RouterAI / OpenRouter / OpenAI (failover)
- **Database**: Supabase (PostgreSQL 16 + Auth + RLS)
- **Deploy**: Docker + Nginx + Coolify

## Структура

```
├── server.js              # Express сервер
├── config.yaml            # Конфигурация платформы (тарифы, провайдеры, лимиты)
├── config/                # Загрузчик конфига + Zod-валидация
├── db/                    # Supabase клиенты + SQL миграции
├── middleware/             # auth, tenant, rateLimit, superadmin, requestId
├── routes/                # API маршруты (widget, auth, clinic, payments, admin, webhooks)
├── services/              # Бизнес-логика (ai, fsm, usage, analytics, telegram, crypto, events, gc)
├── providers/ai/          # AI-провайдеры с failover (RouterAI, OpenRouter, OpenAI)
├── src/admin/             # Админ-панель клиники (10 страниц)
├── src/superadmin/        # Суперадмин (5 страниц)
├── src/widget/            # Встраиваемый виджет
├── src/landing/           # Продающий лендинг
├── Dockerfile             # Multi-stage сборка
├── docker-compose.yml     # Продакшен деплой
├── nginx.conf             # Reverse proxy + SSL
└── backup.sh              # Бэкап PostgreSQL
```

## Быстрый старт (разработка)

```bash
cp .env.example .env
# Заполнить .env

npm install
npm run dev
```

Открыть:
- http://localhost:5173 — Основное приложение (демо)
- http://localhost:5173/landing.html — Лендинг
- http://localhost:5173/admin.html — Админ-панель
- http://localhost:5173/superadmin.html — Суперадмин

## Деплой

См. [DEPLOY.md](DEPLOY.md)

## Архитектура

- **Мультитенантность**: slug-based routing + RLS через Custom JWT Claims
- **Token Reservation Pattern**: атомарный `reserve_tokens()` → AI вызов → `commit_ai_usage()`
- **AI Provider Router**: автоматический failover между провайдерами
- **FSM Engine**: конечный автомат для состояния диалога (pluggable stores)
- **Prepaid Balance**: клиника платит вперёд, API-расходы включены в тариф

Подробнее: [ARCHITECTURE.md](ARCHITECTURE.md)

## Тарифы

| План | Цена | Диалогов/мес |
|------|------|-------------|
| Trial | 0 ₽ (7 дней) | 50 |
| Start | 1 990 ₽ | 300 |
| Business | 4 990 ₽ | 1 000 |
| Pro | 9 990 ₽ | ∞ |

## Лицензия

MIT
