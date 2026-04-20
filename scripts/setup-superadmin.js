#!/usr/bin/env node
/**
 * Утилита для создания/сброса пароля суперадмина
 *
 * Использование:
 *   node scripts/setup-superadmin.js
 */

import { createClient } from '@supabase/supabase-js';
import * as readline from 'readline';
import { promisify } from 'util';
import { readFileSync } from 'fs';
import { join } from 'path';

// Загружаем переменные окружения из .env вручную
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

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = promisify(rl.question).bind(rl);

async function main() {
  console.log('\n🔧 Настройка суперадмина\n');
  console.log(`📧 Email суперадмина: ${SUPERADMIN_EMAIL}`);

  // Проверяем, существует ли пользователь
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existingUser = existingUsers?.users?.find(u => u.email === SUPERADMIN_EMAIL);

  if (existingUser) {
    console.log(`\n✅ Пользователь найден (ID: ${existingUser.id})`);
    console.log('\nВыберите действие:');
    console.log('  1 - Сбросить пароль');
    console.log('  2 - Удалить пользователя и создать заново');
    console.log('  0 - Отмена');

    const choice = await question('\nВаш выбор: ');

    if (choice === '1') {
      await resetPassword(existingUser.id);
    } else if (choice === '2') {
      await deleteAndCreate(existingUser.id);
    } else {
      console.log('❌ Отменено');
      rl.close();
      return;
    }
  } else {
    console.log('\n⚠️  Пользователь не найден');
    const confirm = await question('Создать нового суперадмина? (y/n): ');

    if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes' || confirm.toLowerCase() === 'д') {
      await createSuperadmin();
    } else {
      console.log('❌ Отменено');
    }
  }

  rl.close();
}

async function resetPassword(userId) {
  console.log('\n🔑 Введите новый пароль для суперадмина');
  const password = await question('Пароль (минимум 8 символов): ');

  if (password.length < 8) {
    console.error('❌ Пароль должен быть не менее 8 символов');
    return;
  }

  console.log('\n⏳ Сброс пароля...');

  const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password: password
  });

  if (error) {
    console.error('❌ Ошибка при сбросе пароля:', error.message);
    return;
  }

  console.log('\n✅ Пароль успешно обновлён!');
  console.log('\n📋 Данные для входа:');
  console.log(`   URL: http://localhost:3000/super`);
  console.log(`   Email: ${SUPERADMIN_EMAIL}`);
  console.log(`   Пароль: ${password}`);
  console.log('\n⚠️  ВАЖНО: Сохраните эти данные в безопасном месте!');
}

async function deleteAndCreate(userId) {
  console.log('\n⏳ Удаление существующего пользователя...');

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteError) {
    console.error('❌ Ошибка при удалении:', deleteError.message);
    return;
  }

  console.log('✅ Пользователь удалён');
  await createSuperadmin();
}

async function createSuperadmin() {
  console.log('\n🔑 Введите пароль для нового суперадмина');
  const password = await question('Пароль (минимум 8 символов): ');

  if (password.length < 8) {
    console.error('❌ Пароль должен быть не менее 8 символов');
    return;
  }

  console.log('\n⏳ Создание суперадмина...');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: SUPERADMIN_EMAIL,
    password: password,
    email_confirm: true,
    user_metadata: { role: 'superadmin' }
  });

  if (error) {
    console.error('❌ Ошибка при создании:', error.message);
    return;
  }

  console.log('\n✅ Суперадмин успешно создан!');
  console.log(`   User ID: ${data.user.id}`);
  console.log('\n📋 Данные для входа:');
  console.log(`   URL: http://localhost:3000/super`);
  console.log(`   Email: ${SUPERADMIN_EMAIL}`);
  console.log(`   Пароль: ${password}`);
  console.log('\n⚠️  ВАЖНО: Сохраните эти данные в безопасном месте!');
}

main().catch(err => {
  console.error('❌ Критическая ошибка:', err.message);
  process.exit(1);
});
