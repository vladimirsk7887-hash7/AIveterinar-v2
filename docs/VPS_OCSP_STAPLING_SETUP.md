# Включение OCSP Stapling на VPS (nginx)

## Проблема
Яндекс.Браузер с Нейропротектом блокирует vetai24.ru из-за отсутствия OCSP Stapling.

**Текущее состояние:**
```
OCSP response: no response sent ❌
```

**Нужно получить:**
```
OCSP response:
  OCSP Response Status: successful (0x0) ✅
```

---

## Решение: Включить OCSP Stapling в nginx

### Шаг 1: Подключиться к VPS

```bash
ssh root@92.53.119.24
# Введите пароль root
```

---

### Шаг 2: Найти конфигурацию nginx для vetai24.ru

```bash
# Найти конфиг файл для vetai24.ru
grep -r "vetai24.ru" /etc/nginx/sites-enabled/
# или
grep -r "vetai24.ru" /etc/nginx/conf.d/
```

Обычно это:
- `/etc/nginx/sites-enabled/vetai24.ru.conf`
- `/etc/nginx/conf.d/vetai24.ru.conf`
- `/etc/nginx/nginx.conf`

---

### Шаг 3: Создать бэкап конфига

```bash
# Замените путь на найденный в Шаге 2
cp /etc/nginx/sites-enabled/vetai24.ru.conf /etc/nginx/sites-enabled/vetai24.ru.conf.backup
```

---

### Шаг 4: Отредактировать конфиг nginx

```bash
# Откройте конфиг (замените путь)
nano /etc/nginx/sites-enabled/vetai24.ru.conf
```

Найдите блок `server` для HTTPS (порт 443) и добавьте **внутри** блока:

```nginx
server {
    listen 443 ssl http2;
    server_name vetai24.ru www.vetai24.ru;

    # SSL сертификаты (уже есть)
    ssl_certificate /etc/letsencrypt/live/vetai24.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vetai24.ru/privkey.pem;

    # ⬇️ ДОБАВЬТЕ ЭТИ СТРОКИ ⬇️

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/vetai24.ru/chain.pem;

    # DNS resolver для OCSP (Google DNS + Cloudflare DNS)
    resolver 8.8.8.8 8.8.4.4 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    # ⬆️ КОНЕЦ ДОБАВЛЕНИЯ ⬆️

    # ... остальная конфигурация ...
}
```

**Сохраните файл:**
- `Ctrl + O` → Enter (сохранить)
- `Ctrl + X` (выйти)

---

### Шаг 5: Проверить конфигурацию nginx

```bash
nginx -t
```

**Ожидаемый результат:**
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

**Если есть ошибки:**
- Проверьте пути к сертификатам (`/etc/letsencrypt/live/vetai24.ru/`)
- Убедитесь, что добавили строки **внутри** блока `server {}`
- Восстановите бэкап: `cp /etc/nginx/sites-enabled/vetai24.ru.conf.backup /etc/nginx/sites-enabled/vetai24.ru.conf`

---

### Шаг 6: Перезагрузить nginx

```bash
systemctl reload nginx
# или
service nginx reload
```

---

### Шаг 7: Проверить OCSP Stapling

**Через 1-2 минуты** выполните проверку:

```bash
echo | openssl s_client -connect vetai24.ru:443 -status 2>&1 | grep -A 10 "OCSP"
```

**Должно быть:**
```
OCSP response:
  OCSP Response Status: successful (0x0)
  Response Type: Basic OCSP Response
  ...
  Cert Status: good
```

✅ Если видите `OCSP Response Status: successful` — **ВСЁ РАБОТАЕТ!**

❌ Если видите `OCSP response: no response sent` — подождите 2-3 минуты и проверьте снова (nginx кэширует OCSP ответ).

---

### Шаг 8: Проверить в браузере

1. Откройте **новую вкладку** (или Ctrl+Shift+N для инкогнито)
2. Перейдите: `https://vetai24.ru/super`
3. Браузер **НЕ ДОЛЖЕН** показывать предупреждение

✅ **Готово!** Теперь OCSP Stapling включен и Нейропротект не блокирует сайт.

---

## Дополнительно: Улучшенная конфигурация SSL

Если хотите максимальную безопасность, добавьте также:

```nginx
server {
    listen 443 ssl http2;
    server_name vetai24.ru www.vetai24.ru;

    # SSL сертификаты
    ssl_certificate /etc/letsencrypt/live/vetai24.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/vetai24.ru/privkey.pem;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/vetai24.ru/chain.pem;
    resolver 8.8.8.8 8.8.4.4 1.1.1.1 valid=300s;
    resolver_timeout 5s;

    # Современные протоколы TLS
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;

    # Сильные шифры
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384';

    # Сессии SSL
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    # HSTS (опционально, но рекомендуется)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # ... остальная конфигурация ...
}
```

---

## Автоматическое продление сертификатов

Certbot уже настроил автоматическое продление. Проверьте:

```bash
# Проверить таймер certbot
systemctl status certbot.timer

# Или проверить cron
cat /etc/cron.d/certbot
```

**OCSP Stapling будет работать автоматически** после каждого продления сертификата.

---

## Troubleshooting

### Проблема: `resolver` не работает
```nginx
# Используйте только Google DNS
resolver 8.8.8.8 8.8.4.4 valid=300s;
```

### Проблема: `chain.pem` не найден
```bash
# Проверьте путь
ls -la /etc/letsencrypt/live/vetai24.ru/

# Если нет chain.pem, используйте fullchain.pem
ssl_trusted_certificate /etc/letsencrypt/live/vetai24.ru/fullchain.pem;
```

### Проблема: nginx не перезагружается
```bash
# Проверьте логи
tail -f /var/log/nginx/error.log

# Перезапустите полностью
systemctl restart nginx
```

---

## Источники

- [Автоматическое продление SSL-сертификата Let's Encrypt](https://mb4.ru/protocol/https/1331-certbot-q-renew-ssl-sertificat.html)
- [Установка Let's Encrypt с автопродлением - SpaceWeb](https://help.sweb.ru/ustanovka-besplatnogo-sertifikata-let-s-encrypt-s-avtoprodleniem_1213.html)
- [Сервис Let's Encrypt в России](https://ispserver.ru/service-lets-encrypt-blocked-by-rkn)
- [OCSP Stapling в nginx](https://tokmakov.msk.ru/blog/item/778)
