import { EventEmitter } from 'events';
import { supabaseAdmin } from '../db/supabase.js';
import { createLogger } from './logger.js';
import { notifyClinicChats } from './telegram.js';
import { sendMaxMessage } from './max.js';
import { decrypt } from './crypto.js';

const logger = createLogger();

class EventBus extends EventEmitter {
  emit(eventType, data = {}) {
    logger.debug({ eventType, clinicId: data.clinic_id }, 'Event emitted');
    // Use super.emit so once() listeners are properly removed after first call
    try {
      return super.emit(eventType, data);
    } catch (err) {
      logger.error({ eventType, error: err.message }, 'Event listener error');
      return false;
    }
  }
}

export const eventBus = new EventBus();

// Register default listeners
export function setupEventListeners(config) {
  const tracked = config?.logging?.tracked_events || [];

  // Log all tracked events to console AND save to DB
  for (const eventType of tracked) {
    eventBus.on(eventType, async (data) => {
      logger.info({ eventType, ...data }, 'Tracked event');

      // Save to events table in DB
      if (supabaseAdmin) {
        try {
          const { clinic_id, ...rest } = data;
          await supabaseAdmin.from('events').insert({
            clinic_id: clinic_id || null,
            event_type: eventType,
            data: rest,
          });
        } catch (err) {
          logger.error({ eventType, error: err.message }, 'Failed to save event to DB');
        }
      }
    });
  }

  // Send appointment notifications via Telegram and Max
  eventBus.on('appointment.created', async (data) => {
    const { owner_name, contact_method, contact_value, pet_card, summary, status, tg_chat_ids, tg_bot_token_encrypted, max_bot_token_encrypted, max_chat_id } = data;

    logger.info({
      hasTgChatIds: !!(tg_chat_ids?.length),
      tgCount: tg_chat_ids?.length || 0,
      hasMaxToken: !!max_bot_token_encrypted,
      hasMaxChatId: !!max_chat_id,
    }, 'appointment.created — notification check');

    // Format contact method label
    const contactLabel = contact_method === 'telegram' ? 'Telegram'
      : contact_method === 'max' ? 'Max'
        : contact_method === 'phone' ? 'Телефон' : contact_method;

    // Status emoji
    const statusLabel = {
      red: '🔴 ЭКСТРЕННО', yellow: '🟡 Требует внимания',
      green: '🟢 Стабильное', consultation: '🔵 Консультация',
    }[status] || '🔵 Консультация';

    // Build patient card block
    const card = pet_card || {};
    const cardLines = [
      card.name && `Имя: ${card.name}`,
      card.species && `Вид: ${card.species}`,
      card.breed && `Порода: ${card.breed}`,
      card.age && `Возраст: ${card.age}`,
      card.weight && `Вес: ${card.weight}`,
      card.symptoms?.length && `Симптомы: ${card.symptoms.join(', ')}`,
      card.notes && `Заметки: ${card.notes}`,
    ].filter(Boolean).join('\n');

    const divider = '─────────────────';

    const text = [
      '🏥 НОВАЯ ЗАПИСЬ НА ПРИЁМ',
      '',
      `👤 Владелец: ${owner_name}`,
      `📱 Связь (${contactLabel}): ${contact_value}`,
      `⚡ Статус: ${statusLabel}`,
      '',
      divider,
      `🐾 КАРТОЧКА ПАЦИЕНТА`,
      cardLines || 'Нет данных',
      '',
      divider,
      summary || 'Саммари недоступно',
      '',
      divider,
      '🕐 Отправлено через AI-Ветеринар',
    ].join('\n');

    // Telegram notification — use clinic's own bot token if available
    if (tg_chat_ids?.length) {
      const plainText = text;
      if (tg_bot_token_encrypted) {
        try {
          const tgToken = decrypt(tg_bot_token_encrypted);
          Promise.allSettled(
            tg_chat_ids.map((chatId) =>
              import('./telegram.js').then(({ sendTelegramMessage }) =>
                sendTelegramMessage(tgToken, chatId, plainText)
              )
            )
          ).catch(() => {});
        } catch (err) {
          logger.error({ error: err.message }, 'TG token decrypt failed');
        }
      } else {
        notifyClinicChats(tg_chat_ids, plainText).catch((err) => {
          logger.error({ error: err.message }, 'TG notify failed');
        });
      }
    }

    // Max notification
    if (max_chat_id && max_bot_token_encrypted) {
      try {
        const maxToken = decrypt(max_bot_token_encrypted);
        logger.info({ maxChatId: max_chat_id, tokenLen: maxToken.length }, 'Sending Max notification');
        const sent = await sendMaxMessage(maxToken, max_chat_id, text);
        logger.info({ sent, maxChatId: max_chat_id }, 'Max notification result');
      } catch (err) {
        logger.error({ error: err.message }, 'Max token decrypt failed');
      }
    } else {
      logger.warn({ max_chat_id, hasToken: !!max_bot_token_encrypted }, 'Max notification skipped — missing credentials');
    }
  });

  logger.info({ count: tracked.length }, 'Event listeners registered');
}
