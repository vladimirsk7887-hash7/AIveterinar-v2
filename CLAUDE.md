# АИ-Ветеринар

## Что это
AI-ветеринарный помощник — веб-приложение, которое:
- Разговаривает с владельцем питомца через AI (OpenAI GPT-4o)
- Определяет срочность ситуации (триаж: красный/жёлтый/зелёный)
- Задаёт строго один вопрос за сообщение
- Собирает карточку пациента в процессе диалога
- Даёт план действий и направляет к ветеринару
- Позволяет записаться на приём (саммари → Telegram)

## Стек
- **Frontend**: React + Vite (модульные компоненты)
- **Backend**: Express 5 (server.js) — проксирует OpenAI и Telegram
- **AI**: OpenAI API (gpt-4o)
- **Deploy**: Amvera.ru через GitHub webhook
- **Стиль**: Тёмная тема, неоновые акценты, JetBrains Mono + Inter, мобильная адаптация

## Структура проекта
```
app/
├── server.js              # Express backend (/api/chat, /api/telegram, /api/health)
├── amvera.yml             # Конфиг деплоя Amvera
├── package.json           # Зависимости + скрипты (build, start)
├── vite.config.js         # Vite конфиг (base: '/')
├── index.html             # Точка входа
├── src/
│   ├── App.jsx            # Главный компонент (Home + Chat + mobile drawer)
│   ├── index.css          # Стили + медиа-запросы (768px, 480px)
│   ├── lib/
│   │   ├── ai.js          # callAI(), parseMeta(), mergeCard(), checkServerKey()
│   │   ├── telegram.js    # sendToTelegram()
│   │   └── constants.js   # SYSTEM_PROMPT, PET_TYPES, STATUS_CONFIG
│   └── components/
│       ├── AnimalSVG.jsx
│       ├── StatusBar.jsx
│       ├── PatientCard.jsx
│       ├── ChatMessage.jsx
│       ├── SuggestionButtons.jsx
│       ├── AppointmentModal.jsx
│       └── SettingsModal.jsx
└── .env                   # Локальный (не в git)
```

## Архитектура

### API эндпоинты (server.js)
- `POST /api/chat` — проксирует запросы к OpenAI (ключ на сервере)
- `POST /api/telegram` — отправляет сообщения через Telegram Bot API
- `GET /api/health` — healthcheck + проверка наличия ключа
- `GET /*` — SPA fallback (index.html)

### Экраны
1. **Главная** — выбор типа питомца (6 SVG-карточек)
2. **Чат** — сайдбар-drawer (мобилка) / фиксированный (десктоп) + карточка пациента + чат + кнопки-подсказки

### Логика AI
AI возвращает метаданные в `<meta>...</meta>` JSON-блоке:
```json
{
  "status": "red|yellow|green|consultation|blocked",
  "card": { "name", "species", "breed", "age", "weight", "symptoms", "notes" },
  "suggestions": ["подсказка 1", "подсказка 2"]
}
```

### Запись на приём
1. Кнопка появляется после 2+ сообщений
2. Ввод имени, способа связи, контакта
3. AI генерирует саммари → отправка в Telegram
4. Fallback: copy+paste если Telegram не настроен

## Конфигурация (env vars на Amvera)
- `OPENAI_API_KEY` — ключ OpenAI (обязательно)
- `TG_BOT_TOKEN` — токен Telegram бота
- `TG_CHAT_ID` — ID чата (по умолчанию: `-5263363292`)
- `PORT` — порт сервера (по умолчанию: `3000`)

## Deploy
- GitHub repo: `vladimirsk7887-hash7/AIveterinar`
- Amvera подключена через webhook: `git push` → автосборка
- Amvera environment: `node` (НЕ `nodejs`)
- Build: `npm ci` + `npm run build`
- Run: `node server.js`

## Что можно улучшить
- Экспорт карточки в PDF
- Прикрепление фото
- История диалогов (persistent storage)
- Мультиязычность (RU/EN)
- Интеграция с картами (ветклиники)
- TypeScript, тесты, error boundaries
