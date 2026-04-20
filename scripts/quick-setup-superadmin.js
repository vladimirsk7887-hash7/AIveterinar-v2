#!/usr/bin/env node
/**
 * Быстрая настройка суперадмина (неинтерактивная)
 * Создает пароль автоматически или использует переданный аргумент
 *
 * Использование:
 *   node scripts/quick-setup-superadmin.js
 *   node scripts/quick-setup-superadmin.js mypassword123
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';
import crypto from 'crypto';

// Загружаем переменные окружения из .env
function loadEnv() {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf-8');
    const lines = envContent.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        process.env[key] = value;
      }
    }
  } catch (err) {
    console.error('❌ Не удалось прочитать .env файл:', err.message);
    process.exit(1);
  }
}

loadEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Ошибка: SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY должны быть установлены в .env');
  process.exit(1);
}

if (!SUPERADMIN_EMAIL) {
  console.error('❌ Ошибка: SUPERADMIN_EMAIL должен быть установлен в .env');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Пароль из аргументов или генерируем случайный
const password = process.argv[2] || crypto.randomBytes(8).toString('hex');

if (password.length < 8) {
  console.error('❌ Пароль должен быть не менее 8 символов');
  process.exit(1);
}

async function main() {
  console.log('\n🔧 Быстрая настройка суперадмина\n');
  console.log(`📧 Email: ${SUPERADMIN_EMAIL}`);
  console.log(`🔑 Пароль: ${password}\n`);

  // Проверяем, существует ли пользователь
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === SUPERADMIN_EMAIL);

  if (existingUser) {
    console.log(`⚠️  Пользователь уже существует (ID: ${existingUser.id})`);
    console.log('⏳ Сброс пароля...\n');

    const { error } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
      password: password
    });

    if (error) {
      console.error('❌ Ошибка при сбросе пароля:', error.message);
      process.exit(1);
    }

    console.log('✅ Пароль успешно обновлён!');
  } else {
    console.log('⏳ Создание нового суперадмина...\n');

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: SUPERADMIN_EMAIL,
      password: password,
      email_confirm: true,
      user_metadata: { role: 'superadmin' }
    });

    if (error) {
      console.error('❌ Ошибка при создании:', error.message);
      process.exit(1);
    }

    console.log('✅ Суперадмин успешно создан!');
    console.log(`   User ID: ${data.user.id}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📋 ДАННЫЕ ДЛЯ ВХОДА:');
  console.log('═'.repeat(60));
  console.log(`   URL:    http://localhost:3000/super`);
  console.log(`   Email:  ${SUPERADMIN_EMAIL}`);
  console.log(`   Пароль: ${password}`);
  console.log('═'.repeat(60));
  console.log('\n⚠️  ВАЖНО: Сохраните эти данные в безопасном месте!\n');
}

main().catch(err => {
  console.error('❌ Критическая ошибка:', err.message);
  process.exit(1);
});
