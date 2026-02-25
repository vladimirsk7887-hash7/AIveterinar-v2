# Ручное создание клиники в AI-Ветеринар

## Вариант 1: Через Supabase UI (рекомендуется)

### Шаг 1: Создать пользователя в Supabase Auth

1. Откройте Supabase Dashboard: https://supabase.24aivet.ru
2. Войдите в панель управления
3. **Authentication → Users → Add User**
4. Заполните форму:
   - **Email**: `clinic@example.com` (email ветклиники)
   - **Password**: `минимум 8 символов` (например: `SecurePass123`)
   - **Auto Confirm User**: ✅ (включить, чтобы пользователь мог сразу войти)
5. **Create User**
6. **Скопируйте User ID** (UUID, например: `12345678-1234-1234-1234-123456789abc`)

### Шаг 2: Создать запись в таблице `clinics`

1. В Supabase Dashboard: **Table Editor → clinics → Insert row**
2. Заполните поля:

```sql
auth_user_id: 12345678-1234-1234-1234-123456789abc  -- UUID из шага 1
name: Ветклиника "Черепашка"                        -- название клиники
slug: cherepashka                                    -- уникальный slug (только латиница, цифры, дефис)
email: clinic@example.com                            -- тот же email что в Auth
phone: +79281043623                                  -- телефон (опционально)
city: Москва                                         -- город (опционально)
plan_id: free                                        -- тариф (free, basic, pro, enterprise)
trial_ends_at: 2026-03-27 00:00:00+00               -- конец триала (опционально)
settings: {"onboarding": "concierge"}                -- JSON с настройками
created_at: 2026-02-25 12:00:00+00                  -- автоматически
```

3. **Save**

### Шаг 3: Передать данные ветеринару

Отправьте ветеринару:
```
🏥 Доступ к AI-Ветеринар

Email: clinic@example.com
Пароль: SecurePass123

Админ-панель: https://vetai24.ru/admin
Виджет: https://vetai24.ru/widget/cherepashka

Инструкция по настройке:
1. Войдите в админ-панель
2. Настройте виджет в разделе "Виджет"
3. Скопируйте код виджета на ваш сайт
```

---

## Вариант 2: Через SQL (для опытных)

### Подключитесь к Supabase через psql

```bash
# Подключение к Supabase на VPS #2
ssh root@188.225.87.99

# Подключение к PostgreSQL
docker exec -it supabase-db psql -U postgres -d postgres
```

### Выполните SQL-скрипт

```sql
-- 1. Создать пользователя в auth.users
-- ВАЖНО: Замените значения на свои!
DO $$
DECLARE
  new_user_id uuid;
  encrypted_password text;
BEGIN
  -- Генерация UUID для нового пользователя
  new_user_id := gen_random_uuid();

  -- Хэширование пароля (используйте реальный bcrypt hash!)
  -- Для генерации: используйте онлайн bcrypt генератор или команду ниже
  encrypted_password := crypt('SecurePass123', gen_salt('bf'));

  -- Вставка пользователя в auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'clinic@example.com',
    encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  -- Создание клиники
  INSERT INTO public.clinics (
    auth_user_id,
    name,
    slug,
    email,
    phone,
    city,
    plan_id,
    settings,
    created_at
  ) VALUES (
    new_user_id,
    'Ветклиника "Черепашка"',
    'cherepashka',
    'clinic@example.com',
    '+79281043623',
    'Москва',
    'free',
    '{"onboarding": "concierge"}'::jsonb,
    NOW()
  );

  RAISE NOTICE 'Клиника создана! User ID: %', new_user_id;
END $$;
```

### Проверка

```sql
-- Проверить, что пользователь создан
SELECT id, email, email_confirmed_at, created_at
FROM auth.users
WHERE email = 'clinic@example.com';

-- Проверить, что клиника создана
SELECT id, name, slug, email, plan_id
FROM public.clinics
WHERE email = 'clinic@example.com';
```

---

## Вариант 3: Через API (cURL)

### 1. Получить Supabase Service Role Key

```bash
# Из .env файла на сервере
echo $SUPABASE_SERVICE_ROLE_KEY
```

### 2. Создать пользователя через Supabase Auth Admin API

```bash
curl -X POST 'https://supabase.24aivet.ru/auth/v1/admin/users' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "clinic@example.com",
    "password": "SecurePass123",
    "email_confirm": true
  }'
```

Ответ:
```json
{
  "id": "12345678-1234-1234-1234-123456789abc",
  "email": "clinic@example.com",
  ...
}
```

**Скопируйте `id` из ответа!**

### 3. Создать запись в таблице clinics

```bash
curl -X POST 'https://supabase.24aivet.ru/rest/v1/clinics' \
  -H "apikey: YOUR_SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "auth_user_id": "12345678-1234-1234-1234-123456789abc",
    "name": "Ветклиника Черепашка",
    "slug": "cherepashka",
    "email": "clinic@example.com",
    "phone": "+79281043623",
    "city": "Москва",
    "plan_id": "free",
    "settings": {"onboarding": "concierge"}
  }'
```

---

## Генерация slug из названия (транслитерация)

### JavaScript (Node.js)

```javascript
function transliterate(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
    'ь':'','э':'e','ю':'yu','я':'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map(ch => map[ch] || ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

console.log(transliterate('Ветклиника "Черепашка"'));
// Output: vetklinika-cherepashka
```

### Python

```python
def transliterate(text):
    map = {
        'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
        'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
        'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
        'ь':'','э':'e','ю':'yu','я':'ya',
    }
    text = text.lower()
    result = ''.join(map.get(c, c) for c in text)
    import re
    result = re.sub(r'[^a-z0-9]+', '-', result)
    result = result.strip('-')
    return result[:50]

print(transliterate('Ветклиника "Черепашка"'))
# Output: vetklinika-cherepashka
```

---

## Проверка уникальности slug

### SQL

```sql
-- Проверить, занят ли slug
SELECT slug FROM public.clinics WHERE slug = 'cherepashka';

-- Если занят, добавить номер
SELECT slug FROM public.clinics WHERE slug LIKE 'cherepashka%' ORDER BY slug DESC LIMIT 1;
-- Например: cherepashka, cherepashka-2, cherepashka-3
```

---

## Тарифы (plan_id)

- `free` — Бесплатный (100 диалогов/месяц)
- `basic` — Базовый (500 диалогов/месяц, 990₽)
- `pro` — Профессиональный (2000 диалогов/месяц, 2990₽)
- `enterprise` — Корпоративный (безлимит, индивидуально)

---

## Структура таблицы `clinics`

```sql
CREATE TABLE public.clinics (
  id SERIAL PRIMARY KEY,
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  city VARCHAR(100),
  plan_id VARCHAR(50) DEFAULT 'free',
  trial_ends_at TIMESTAMPTZ,
  subscription_id VARCHAR(255),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Troubleshooting

### Ошибка: "Email already registered"

```sql
-- Найти пользователя
SELECT id, email FROM auth.users WHERE email = 'clinic@example.com';

-- Удалить пользователя (если нужно)
DELETE FROM auth.users WHERE email = 'clinic@example.com';
```

### Ошибка: "Slug already exists"

```sql
-- Изменить slug
UPDATE public.clinics SET slug = 'cherepashka-2' WHERE slug = 'cherepashka';
```

### Сброс пароля

```bash
# Через Supabase UI:
# Authentication → Users → найти пользователя → Send recovery email

# Или вручную в SQL:
UPDATE auth.users
SET encrypted_password = crypt('NewPassword123', gen_salt('bf'))
WHERE email = 'clinic@example.com';
```

---

## Автоматизация (скрипт)

Создайте файл `create-clinic.js`:

```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.24aivet.ru';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createClinic(clinicData) {
  const { name, email, password, phone, city } = clinicData;

  // 1. Создать auth пользователя
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError) {
    console.error('Auth error:', authError);
    return;
  }

  // 2. Генерация slug
  const slug = transliterate(name);

  // 3. Создать клинику
  const { data: clinic, error: clinicError } = await supabase
    .from('clinics')
    .insert({
      auth_user_id: authData.user.id,
      name,
      slug,
      email,
      phone,
      city,
      plan_id: 'free',
      settings: { onboarding: 'concierge' },
    })
    .select()
    .single();

  if (clinicError) {
    console.error('Clinic error:', clinicError);
    return;
  }

  console.log('✅ Клиника создана!');
  console.log('User ID:', authData.user.id);
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('Slug:', slug);
  console.log('Admin: https://vetai24.ru/admin');
  console.log('Widget: https://vetai24.ru/widget/' + slug);
}

function transliterate(text) {
  const map = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i',
    'й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t',
    'у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y',
    'ь':'','э':'e','ю':'yu','я':'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map(ch => map[ch] || ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
}

// Использование
createClinic({
  name: 'Ветклиника "Черепашка"',
  email: 'cherepashka@example.com',
  password: 'SecurePass123',
  phone: '+79281043623',
  city: 'Москва',
});
```

Запуск:
```bash
node create-clinic.js
```

---

## Полезные ссылки

- Supabase Dashboard: https://supabase.24aivet.ru
- Admin панель: https://vetai24.ru/admin
- Superadmin панель: https://vetai24.ru/super
- API Health: https://vetai24.ru/api/health
- Widget example: https://vetai24.ru/widget/demo
