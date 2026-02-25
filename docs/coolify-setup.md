# Настройка Coolify: Auto-deploy VPS #2 → VPS #3

## Инфраструктура
- **VPS #2** (188.225.87.99): Coolify + Supabase
- **VPS #3** (92.53.119.24, 192.168.0.5): AI-Ветеринар App
- **GitHub**: vladimirsk7887-hash7/AIveterinar-v2
- **Домен**: vetai24.ru → VPS #3

---

## Шаг 1: Подготовка SSH (VPS #2 → VPS #3)

### 1.1 На VPS #2 (Coolify)
```bash
ssh root@188.225.87.99

# Создать SSH ключ
ssh-keygen -t ed25519 -C "coolify-to-vps3" -f /root/.ssh/coolify_vps3 -N ""

# Показать публичный ключ (скопировать)
cat /root/.ssh/coolify_vps3.pub
```

### 1.2 На VPS #3 (App Server)
```bash
ssh root@92.53.119.24

# Добавить публичный ключ
nano /root/.ssh/authorized_keys
# Вставить ключ с VPS #2, сохранить

# Проверить права
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
```

### 1.3 Проверка подключения (с VPS #2)
```bash
# На VPS #2
ssh -i /root/.ssh/coolify_vps3 root@192.168.0.5
# Должно подключиться без пароля (используем приватный IP)
```

---

## Шаг 2: Coolify UI - Добавить удалённый сервер

### 2.1 Открыть Coolify
- URL: http://188.225.87.99:8000 (или custom domain)
- Login

### 2.2 Servers → Add Server
- **Name**: `vps3-app`
- **Description**: AI-Ветеринар Production
- **IP Address**: `192.168.0.5` (приватная сеть) или `92.53.119.24`
- **Port**: `22`
- **User**: `root`
- **Private Key**: скопировать содержимое `/root/.ssh/coolify_vps3` (приватный ключ)

### 2.3 Test Connection → Save

---

## Шаг 3: Создать проект в Coolify

### 3.1 Projects → New Project
- **Name**: `aivet-saas`
- **Description**: AI-Ветеринар SaaS Platform

### 3.2 New Resource → Public Repository
- **Git Provider**: GitHub
- **Repository URL**: `https://github.com/vladimirsk7887-hash7/AIveterinar-v2`
- **Branch**: `main`

### 3.3 Build Settings
- **Build Pack**: Dockerfile
- **Dockerfile Location**: `./Dockerfile`
- **Docker Compose**: No (используем Dockerfile)
- **Destination**: `vps3-app` (выбрать удалённый сервер)

---

## Шаг 4: Переменные окружения

В Coolify UI → Environment Variables, добавить:

```env
NODE_ENV=production
PORT=3000

# Supabase
SUPABASE_URL=https://<your-supabase>.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=your-jwt-secret

# AI Providers
AI__ROUTERAI_API_KEY=sk-rt-...
AI__OPENROUTER_API_KEY=sk-or-...
OPENAI_API_KEY=sk-...

# Telegram
TG_BOT_TOKEN=123456:ABC-DEF...
TG_CHAT_ID=-5263363292

# Security
ENCRYPTION_KEY=64-char-hex-string
SUPERADMIN_EMAIL=bestbuy7878@gmail.com

# Payments (optional)
YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
YOOKASSA_WEBHOOK_SECRET=
```

*(Скопировать значения с текущего .env на VPS #3)*

---

## Шаг 5: Настроить домен и порты

### 5.1 Domains
- **Domain**: `vetai24.ru`
- **Port**: `3000` (внутренний порт контейнера)
- **HTTPS**: ✅ Enable (Let's Encrypt)

### 5.2 Network
- Coolify автоматически настроит reverse proxy

---

## Шаг 6: Включить Auto-Deploy

### 6.1 В Coolify
- Settings → General
- ✅ **Automatic Deployment** (Enable)
- **Watch Paths**: `/` (деплоить при любых изменениях)

### 6.2 GitHub Webhook
Coolify покажет Webhook URL. Скопировать его.

### 6.3 GitHub Settings
1. Открыть: https://github.com/vladimirsk7887-hash7/AIveterinar-v2/settings/hooks
2. **Add webhook**
   - Payload URL: `<webhook_url_from_coolify>`
   - Content type: `application/json`
   - Secret: (если требуется)
   - Events: ✅ Push events
   - Active: ✅
3. Save

---

## Шаг 7: Первый деплой

### 7.1 В Coolify
- **Deploy** (кнопка)
- Ждать завершения (логи в реальном времени)

### 7.2 Проверка
```bash
# Проверить контейнер на VPS #3
ssh root@92.53.119.24
docker ps | grep aivet

# Проверить логи
docker logs <container_id>

# Проверить API
curl http://localhost:3000/api/health
curl https://vetai24.ru/api/health
```

---

## Шаг 8: Nginx на VPS #3

Coolify может управлять Nginx автоматически. Если нет, то на VPS #3:

```bash
# Обновить nginx.conf
nano /etc/nginx/sites-available/vetai24.ru
```

Заменить `proxy_pass http://localhost:3000;` на:
```nginx
proxy_pass http://localhost:<coolify_assigned_port>;
```

*(Coolify покажет внешний порт в UI)*

Или убрать nginx и дать Coolify управлять всем.

---

## Workflow: Автоматический деплой

1. Делаете `git push` в `main` ветку
2. GitHub отправляет webhook в Coolify
3. Coolify на VPS #2:
   - Pull latest commit
   - `npm ci && npm run build`
   - `docker build`
4. Coolify деплоит на VPS #3:
   - Останавливает старый контейнер
   - Запускает новый
   - Zero-downtime (если настроить)

---

## Troubleshooting

### Деплой падает с ошибкой "Cannot connect to VPS #3"
```bash
# На VPS #2
ssh -i /root/.ssh/coolify_vps3 root@192.168.0.5 -v
# Проверить вывод
```

### Docker build fails
- Проверить логи в Coolify UI
- Убедиться, что Dockerfile корректный
- Проверить, что все зависимости установлены

### SSL не работает
- Убедиться, что DNS для vetai24.ru указывает на VPS #3 (92.53.119.24)
- Проверить: `dig vetai24.ru`
- Coolify автоматически выпустит Let's Encrypt сертификат

---

## Следующие шаги

- [ ] Настроить SSL
- [ ] Настроить health checks
- [ ] Настроить уведомления (Discord/Slack/Email) при деплое
- [ ] Настроить backups
- [ ] Настроить monitoring

