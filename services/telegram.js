import { loadConfig } from '../config/loader.js';
import { createLogger } from './logger.js';

const logger = createLogger();

/**
 * Send a message to a Telegram chat using a specific bot token.
 * @param {string} botToken - Bot token (decrypted)
 * @param {string|number} chatId - Target chat ID
 * @param {string} text - Message text
 * @returns {Promise<boolean>} success
 */
export async function sendTelegramMessage(botToken, chatId, text) {
  const config = loadConfig();
  const maxLen = config.telegram.message_max_length;
  const parseMode = config.telegram.parse_mode;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, maxLen),
        parse_mode: parseMode,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!data.ok) {
      logger.error({ chatId, error: data.description }, 'Telegram send failed');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ chatId, error: err.message }, 'Telegram send error');
    return false;
  }
}

/**
 * Send notification to all clinic TG chats (using platform bot).
 * @param {string[]} chatIds - Array of chat IDs
 * @param {string} text - Message text
 */
export async function notifyClinicChats(chatIds, text) {
  const botToken = process.env.TG_BOT_TOKEN;
  if (!botToken || !chatIds?.length) return;

  const results = await Promise.allSettled(
    chatIds.map((chatId) => sendTelegramMessage(botToken, chatId, text))
  );

  const failed = results.filter((r) => r.status === 'rejected' || r.value === false).length;
  if (failed > 0) {
    logger.warn({ total: chatIds.length, failed }, 'Some TG notifications failed');
  }
}
