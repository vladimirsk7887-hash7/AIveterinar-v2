#!/bin/bash

###############################################################################
# Автоматическая настройка OCSP Stapling для vetai24.ru
# Использование: bash setup-ocsp-stapling.sh
###############################################################################

set -e  # Выход при ошибке

echo "🔧 Настройка OCSP Stapling для vetai24.ru"
echo "=========================================="
echo ""

# Проверка прав root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Ошибка: Запустите скрипт с правами root"
    echo "   Используйте: sudo bash setup-ocsp-stapling.sh"
    exit 1
fi

# Поиск конфигурационного файла nginx для vetai24.ru
echo "🔍 Поиск конфигурации nginx для vetai24.ru..."

NGINX_CONFIG=""
POSSIBLE_PATHS=(
    "/etc/nginx/sites-enabled/vetai24.ru"
    "/etc/nginx/sites-enabled/vetai24.ru.conf"
    "/etc/nginx/conf.d/vetai24.ru.conf"
    "/etc/nginx/sites-available/vetai24.ru"
    "/etc/nginx/sites-available/vetai24.ru.conf"
)

for path in "${POSSIBLE_PATHS[@]}"; do
    if [ -f "$path" ]; then
        NGINX_CONFIG="$path"
        echo "✅ Найден конфиг: $NGINX_CONFIG"
        break
    fi
done

# Если не нашли в стандартных путях, ищем через grep
if [ -z "$NGINX_CONFIG" ]; then
    echo "   Поиск в других местах..."
    FOUND=$(grep -r "server_name.*vetai24.ru" /etc/nginx/ 2>/dev/null | head -1 | cut -d: -f1)
    if [ -n "$FOUND" ]; then
        NGINX_CONFIG="$FOUND"
        echo "✅ Найден конфиг: $NGINX_CONFIG"
    else
        echo "❌ Не удалось найти конфиг nginx для vetai24.ru"
        echo "   Проверьте вручную в /etc/nginx/"
        exit 1
    fi
fi

# Создание резервной копии
BACKUP="${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
echo ""
echo "💾 Создание резервной копии..."
cp "$NGINX_CONFIG" "$BACKUP"
echo "✅ Резервная копия: $BACKUP"

# Проверка, уже включен ли OCSP Stapling
if grep -q "ssl_stapling on" "$NGINX_CONFIG"; then
    echo ""
    echo "⚠️  OCSP Stapling уже настроен в конфиге!"
    echo "   Проверьте конфигурацию вручную: $NGINX_CONFIG"
    exit 0
fi

# Поиск блока server с ssl (порт 443)
echo ""
echo "📝 Добавление OCSP Stapling в конфигурацию..."

# Создаем временный файл с обновленной конфигурацией
TMP_CONFIG=$(mktemp)

# Флаг для отслеживания, добавили ли мы уже OCSP
OCSP_ADDED=false

while IFS= read -r line; do
    echo "$line" >> "$TMP_CONFIG"

    # Ищем строку с ssl_certificate и добавляем OCSP после ssl_certificate_key
    if [[ "$line" =~ ssl_certificate_key ]] && [ "$OCSP_ADDED" = false ]; then
        cat >> "$TMP_CONFIG" << 'EOF'

    # OCSP Stapling (автоматически добавлено скриптом)
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/vetai24.ru/chain.pem;
    resolver 8.8.8.8 8.8.4.4 1.1.1.1 valid=300s;
    resolver_timeout 5s;
EOF
        OCSP_ADDED=true
        echo "✅ OCSP Stapling добавлен в конфигурацию"
    fi
done < "$NGINX_CONFIG"

if [ "$OCSP_ADDED" = false ]; then
    echo "❌ Не удалось найти подходящее место для вставки OCSP Stapling"
    echo "   Добавьте вручную в блок server { ... } для порта 443"
    rm "$TMP_CONFIG"
    exit 1
fi

# Заменяем оригинальный файл
mv "$TMP_CONFIG" "$NGINX_CONFIG"

# Проверка наличия chain.pem
echo ""
echo "🔍 Проверка сертификатов Let's Encrypt..."
if [ ! -f "/etc/letsencrypt/live/vetai24.ru/chain.pem" ]; then
    echo "⚠️  Файл chain.pem не найден"
    echo "   Используем fullchain.pem вместо chain.pem"
    sed -i 's|/chain.pem|/fullchain.pem|g' "$NGINX_CONFIG"
fi

# Проверка конфигурации nginx
echo ""
echo "✅ Проверка конфигурации nginx..."
if nginx -t 2>&1 | tee /tmp/nginx-test.log; then
    echo "✅ Конфигурация nginx корректна"
else
    echo ""
    echo "❌ Ошибка в конфигурации nginx!"
    echo "   Восстановление из резервной копии..."
    cp "$BACKUP" "$NGINX_CONFIG"
    echo "   Резервная копия восстановлена"
    echo ""
    echo "Лог ошибки:"
    cat /tmp/nginx-test.log
    exit 1
fi

# Перезагрузка nginx
echo ""
echo "🔄 Перезагрузка nginx..."
if systemctl reload nginx 2>/dev/null || service nginx reload 2>/dev/null; then
    echo "✅ Nginx перезагружен"
else
    echo "❌ Не удалось перезагрузить nginx"
    echo "   Попробуйте вручную: systemctl restart nginx"
    exit 1
fi

# Ожидание инициализации OCSP
echo ""
echo "⏳ Ожидание инициализации OCSP (30 секунд)..."
sleep 30

# Проверка OCSP Stapling
echo ""
echo "🔍 Проверка OCSP Stapling..."
OCSP_CHECK=$(echo | openssl s_client -connect vetai24.ru:443 -status 2>&1 | grep -A 2 "OCSP response")

if echo "$OCSP_CHECK" | grep -q "successful"; then
    echo "✅ OCSP Stapling работает!"
    echo ""
    echo "$OCSP_CHECK"
elif echo "$OCSP_CHECK" | grep -q "no response sent"; then
    echo "⚠️  OCSP response пока не отправляется"
    echo "   Это нормально в первые минуты после настройки"
    echo "   Проверьте через 5-10 минут:"
    echo "   echo | openssl s_client -connect vetai24.ru:443 -status 2>&1 | grep 'OCSP'"
else
    echo "❓ Неожиданный результат проверки OCSP"
    echo "$OCSP_CHECK"
fi

# Итоговая информация
echo ""
echo "=========================================="
echo "✅ Настройка завершена!"
echo "=========================================="
echo ""
echo "📋 Что было сделано:"
echo "   ✅ Создана резервная копия: $BACKUP"
echo "   ✅ OCSP Stapling добавлен в: $NGINX_CONFIG"
echo "   ✅ Nginx перезагружен"
echo ""
echo "🔍 Проверка в браузере:"
echo "   1. Откройте: https://vetai24.ru/super"
echo "   2. Яндекс.Браузер НЕ должен показывать предупреждение"
echo ""
echo "🛠️  Если проблема осталась:"
echo "   - Подождите 5-10 минут для полной инициализации OCSP"
echo "   - Очистите кэш браузера (Ctrl+Shift+Del)"
echo "   - Откройте сайт в режиме инкогнито (Ctrl+Shift+N)"
echo ""
echo "📚 Логи nginx для диагностики:"
echo "   tail -f /var/log/nginx/error.log"
echo ""
