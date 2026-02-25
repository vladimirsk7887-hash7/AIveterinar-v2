# Деплой AI-Ветеринар SaaS

## Требования
- VPS #1: Ubuntu 22.04, 2+ ГБ RAM (приложение)
- VPS #2: Supabase Self-Hosted (PostgreSQL 16 + Auth + Storage)
- Домен: aiveterinar.ru → VPS #1

## 1. Supabase (VPS #2)

```bash
# Установить Supabase Self-Hosted
# https://supabase.com/docs/guides/self-hosting/docker

# Применить миграции
psql -U postgres -d postgres -f db/migrations/001_initial.sql
psql -U postgres -d postgres -f db/migrations/002_seed.sql
```

## 2. Конфигурация

```bash
# Скопировать и заполнить .env
cp .env.example .env
nano .env
```

Обязательные переменные:
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- Хотя бы один AI провайдер: `AI__ROUTERAI_API_KEY` или `OPENAI_API_KEY`
- `ENCRYPTION_KEY` (64 hex chars): `openssl rand -hex 32`
- `SUPERADMIN_EMAIL`

## 3. Docker Deploy (VPS #1)

```bash
git clone <repo-url> /opt/aivet
cd /opt/aivet

# Заполнить .env
cp .env.example .env
nano .env

# Запуск
docker compose up -d --build

# Проверка
curl http://localhost:3000/api/health
```

## 4. Nginx + SSL

```bash
# Установить Nginx + Certbot
sudo apt install nginx certbot python3-certbot-nginx

# Скопировать конфиг
sudo cp nginx.conf /etc/nginx/sites-available/aiveterinar.ru
sudo ln -s /etc/nginx/sites-available/aiveterinar.ru /etc/nginx/sites-enabled/

# SSL
sudo certbot --nginx -d aiveterinar.ru -d www.aiveterinar.ru

# Перезапуск
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Бэкапы

```bash
# Настроить cron для бэкапов БД
chmod +x backup.sh
crontab -e
# Добавить: 0 3 * * * /opt/aivet/backup.sh >> /var/log/aivet-backup.log 2>&1
```

## Управление

```bash
# Логи
docker compose logs -f app

# Рестарт
docker compose restart app

# Обновление
git pull
docker compose up -d --build

# Статус
docker compose ps
curl https://aiveterinar.ru/api/health
```

## Coolify (альтернатива)

Если используете Coolify:
1. Подключить Git-репозиторий
2. Тип: Dockerfile
3. Указать переменные окружения из `.env`
4. Настроить домен: aiveterinar.ru
5. Coolify автоматически настроит SSL и reverse proxy
