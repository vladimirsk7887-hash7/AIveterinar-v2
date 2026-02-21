# ТЗ: Telegram Mini App — AI-Ветеринар

## 1. Цель

Перенести базовый функционал веб-приложения AI-Ветеринар в Telegram Mini App (TWA),
чтобы пользователи могли получить ветеринарную AI-консультацию прямо внутри Telegram
без перехода на внешний сайт.

## 2. Базовый функционал (MVP)

### 2.1 Экран выбора питомца
- Сетка из 6 карточек: Собака, Кошка, Грызун, Птица, Рептилия, Другое
- Нативный вид для Telegram (используем `tg.themeParams` для цветов)
- По нажатию — переход к чату

### 2.2 AI-чат
- Текстовый чат с AI-ветеринаром (GPT-4o через существующий backend)
- Одно сообщение = один вопрос от AI (триаж-логика сохраняется)
- Кнопки-подсказки (suggestions) под чатом
- Стартовые кнопки симптомов при начале диалога
- Индикатор загрузки (typing dots)

### 2.3 Статус-бар триажа
- Цветовая индикация: красный / жёлтый / зелёный / синий / серый
- Пульсация при экстренном статусе (red)

### 2.4 Карточка пациента
- Автозаполнение по ходу диалога (имя, вид, порода, возраст, вес, симптомы)
- Раскрываемая панель (аккордеон)

### 2.5 Запись на приём
- Кнопка появляется после 2+ сообщений
- Форма: имя владельца, способ связи, контакт
- AI генерирует саммари → отправка в Telegram-чат клиники
- MainButton Telegram SDK для подтверждения

## 3. Архитектура

### 3.1 Схема взаимодействия
```
[Telegram] → [Mini App (React SPA)] → [Существующий Express backend]
                                            ↓               ↓
                                       OpenAI API     Telegram Bot API
```

### 3.2 Frontend
- **Тот же React + Vite стек**, отдельная точка входа для Mini App
- Интеграция с `@twa-dev/sdk` или нативным `window.Telegram.WebApp`
- Адаптация под Telegram Theme Params (светлая/тёмная тема автоматически)
- Viewport: мобильный 100%, без горизонтального скролла
- Отдельная папка: `src/tg-mini-app/` для компонентов Mini App

### 3.3 Backend
- **Без изменений** — используем существующие эндпоинты:
  - `POST /api/chat` — проксирование к OpenAI
  - `POST /api/telegram` — отправка саммари в Telegram
  - `GET /api/health` — healthcheck
- Добавить валидацию `initData` (Telegram Web App signature verification)

### 3.4 Сборка
- Отдельный Vite entry point: `tg-mini-app.html`
- Build output: `dist/tg/` — отдельная папка для Mini App
- Роутинг в Express: `/tg/*` → Mini App SPA

## 4. Интеграция с Telegram SDK

### 4.1 Используемые API
| API | Назначение |
|-----|------------|
| `WebApp.ready()` | Сигнал о готовности |
| `WebApp.themeParams` | Цвета темы пользователя |
| `WebApp.MainButton` | Кнопка "Записаться на приём" |
| `WebApp.BackButton` | Навигация назад (чат → выбор питомца) |
| `WebApp.HapticFeedback` | Вибрация при смене статуса триажа |
| `WebApp.expand()` | Развернуть на весь экран |
| `WebApp.initDataUnsafe` | Данные пользователя (имя для формы записи) |
| `WebApp.close()` | Закрытие после записи |

### 4.2 Кнопка запуска бота
- Команда `/start` у @AiVetClinicBot → открывает Mini App
- Inline-кнопка "Начать консультацию" в приветственном сообщении бота

## 5. Отличия от веб-версии

| Аспект | Веб-версия | Mini App |
|--------|-----------|----------|
| Мульти-питомцы (sidebar) | Да, sidebar со списком | Нет, один питомец за сессию |
| Тема | Ручной toggle | Автоматически из Telegram |
| Навигация | SPA роутинг | BackButton + экраны |
| Запись на приём | Модальное окно | MainButton → нативная форма |
| Имя пользователя | Вручную | Из Telegram initData |
| Закрытие | Вкладка браузера | WebApp.close() |

## 6. Файловая структура (новые файлы)

```
app/
├── tg-mini-app.html              # Entry point для Mini App
├── src/
│   ├── tg-mini-app/
│   │   ├── TgApp.jsx             # Главный компонент Mini App
│   │   ├── main.jsx              # Точка входа React
│   │   ├── tg-app.css            # Стили (Telegram theme vars)
│   │   ├── hooks/
│   │   │   └── useTelegram.js    # Хук для Telegram SDK
│   │   └── screens/
│   │       ├── PetSelect.jsx     # Выбор питомца
│   │       ├── Chat.jsx          # AI-чат
│   │       └── Appointment.jsx   # Форма записи
│   └── lib/                      # Переиспользуются:
│       ├── ai.js                 #   callAI, parseMeta, mergeCard
│       ├── telegram.js           #   sendToTelegram
│       └── constants.js          #   SYSTEM_PROMPT, PET_TYPES, STATUS_CONFIG
└── vite.config.js                # Добавить multi-page build
```

## 7. Этапы разработки

### Этап 1: Инфраструктура
- [ ] Настроить multi-page Vite build (web + tg)
- [ ] Создать entry point `tg-mini-app.html` + `main.jsx`
- [ ] Написать хук `useTelegram.js`
- [ ] Добавить роут `/tg/*` в Express
- [ ] Настроить бота: Menu Button → Mini App URL

### Этап 2: Экраны
- [ ] `PetSelect.jsx` — выбор питомца (адаптация Home)
- [ ] `Chat.jsx` — AI-чат (адаптация основного чата)
- [ ] Интеграция BackButton / MainButton

### Этап 3: Функционал
- [ ] Кнопки-подсказки + стартовые кнопки
- [ ] Статус-бар триажа с HapticFeedback
- [ ] Карточка пациента (аккордеон)
- [ ] Запись на приём через MainButton

### Этап 4: Полировка
- [ ] Валидация initData на сервере
- [ ] Тестирование в Telegram (Android / iOS / Desktop)
- [ ] Деплой на Amvera, настройка BotFather

## 8. Настройка в BotFather

```
/mybots → @AiVetClinicBot → Bot Settings → Menu Button
  URL: https://aivet.amvera.io/tg/
  Text: Консультация
```

## 9. Нефункциональные требования

- **Размер бандла**: < 150 KB gzip (React + компоненты, без лишних зависимостей)
- **Время загрузки**: < 2 сек на 3G (WebApp.ready() как можно раньше)
- **Совместимость**: Telegram Bot API 7.0+, Android 8+, iOS 15+, Desktop
- **Безопасность**: Валидация initData (HMAC-SHA256) на сервере

## 10. Зависимости (новые)

Минимальный подход — без дополнительных пакетов:
- `window.Telegram.WebApp` — встроен в Telegram, не требует npm-установки
- Альтернатива: `@twa-dev/sdk` (~5 KB) для TypeScript-типизации и удобства
