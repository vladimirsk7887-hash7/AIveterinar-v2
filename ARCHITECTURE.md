# Архитектура: Telegram Mini App — AI-Ветеринар

## Схема взаимодействия

```
Telegram App (Android/iOS/Desktop)
  └─ @AiVetClinicBot (Menu Button: "Консультация")
       └─ Mini App (React SPA, /tg/)
            │
            ├─ GET  /api/health       → healthcheck
            ├─ POST /api/chat         → Express → OpenAI GPT-4o
            ├─ POST /api/telegram     → Express → Telegram Bot API
            └─ POST /api/validate-tg  → HMAC-SHA256 initData check
```

## Компоненты

| Модуль | Технология | Назначение |
|--------|-----------|------------|
| Mini App Frontend | React 19 + Vite 7 | SPA внутри Telegram WebView |
| Backend API | Express 5 (существующий) | Проксирование OpenAI + Telegram |
| AI | OpenAI GPT-4o | Ветеринарный триаж |
| Telegram SDK | telegram-web-app.js | Нативные кнопки, тема, haptic |
| Deploy | Amvera.ru | Сборка + хостинг |

## Потоки данных

### 1. Запуск
```
User → @AiVetClinicBot → Menu Button → /tg/ → telegram-web-app.js
  → WebApp.ready() + expand() → PetSelect screen
```

### 2. AI-чат
```
User input → callAI(messages) → POST /api/chat → OpenAI
  → <meta>JSON</meta> + текст → parseMeta() → обновление UI:
    - статус триажа + HapticFeedback
    - карточка пациента
    - кнопки-подсказки
```

### 3. Запись на приём
```
MainButton click → AI summary → POST /api/telegram → Bot API
  → сообщение в чат клиники (-5263363292)
  → WebApp.close()
```

## Файловая структура

```
app/
├── tg-mini-app.html              # Entry point (загружает telegram-web-app.js)
├── src/tg-mini-app/
│   ├── main.jsx                  # React.createRoot + TgApp
│   ├── TgApp.jsx                 # Роутинг экранов + Telegram SDK
│   ├── tg-app.css                # Стили (--tg-theme-* переменные)
│   ├── hooks/useTelegram.js      # React хук для Telegram WebApp API
│   └── screens/
│       ├── PetSelect.jsx         # Выбор питомца (6 карточек)
│       ├── Chat.jsx              # AI-чат + триаж + карточка
│       └── Appointment.jsx       # Форма записи на приём
├── src/lib/                      # Переиспользуемые модули (без изменений)
│   ├── ai.js                     # callAI, parseMeta, mergeCard
│   ├── telegram.js               # sendToTelegram
│   └── constants.js              # SYSTEM_PROMPT, PET_TYPES, STATUS_CONFIG
├── server.js                     # +роут /tg/*, +/api/validate-tg
└── vite.config.js                # +multi-page build (tg-mini-app.html)
```

## Стек (Шаг 5)

| Компонент | Инструмент | Почему |
|-----------|-----------|--------|
| Frontend | React 19 + Vite 7 | Уже в проекте, zero overhead |
| Backend | Express 5 | Уже в проекте, добавляем 1 роут |
| AI | OpenAI GPT-4o | Уже настроен и работает |
| TG SDK | telegram-web-app.js (CDN) | 0 KB в бандле, нативная интеграция |
| Стили | CSS Variables (--tg-theme-*) | Автотема из Telegram |
| Deploy | Amvera.ru | Уже настроен webhook |

## Безопасность

- initData валидируется на сервере (HMAC-SHA256 с TG_BOT_TOKEN)
- OPENAI_API_KEY только на сервере (env vars Amvera)
- Нет localStorage/cookies с секретами
- XSS: все пользовательский ввод через React (auto-escape)
