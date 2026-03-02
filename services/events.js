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
    const { owner_name, contact_method, contact_value, summary, tg_chat_ids, max_bot_token_encrypted, max_chat_id } = data;

    logger.info({
      hasTgChatIds: !!(tg_chat_ids?.length),
      tgCount: tg_chat_ids?.length || 0,
      hasMaxToken: !!max_bot_token_encrypted,
      hasMaxChatId: !!max_chat_id,
      maxChatId: max_chat_id || null,
    }, 'appointment.created — notification check');

    const text = [
      '🐾 **Новая запись на приём**',
      `**Владелец:** ${owner_name}`,
      `**Контакт:** ${contact_method} — ${contact_value}`,
      summary ? `\n${summary}` : '',
    ].filter(Boolean).join('\n');

    // Telegram notification
    if (tg_chat_ids?.length) {
      notifyClinicChats(tg_chat_ids, text.replace(/\*\*/g, '')).catch((err) => {
        logger.error({ error: err.message }, 'TG notify failed');
      });
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
