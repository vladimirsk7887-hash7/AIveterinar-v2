import { createLogger } from './logger.js';

const logger = createLogger();
const MAX_API_BASE = 'https://platform-api.max.ru';

/**
 * Send a message to a Max chat/channel.
 * @param {string} botToken - Bot access token
 * @param {string|number} chatId - Target chat ID
 * @param {string} text - Message text (markdown)
 * @returns {Promise<boolean>} success
 */
export async function sendMaxMessage(botToken, chatId, text) {
  try {
    const res = await fetch(`${MAX_API_BASE}/messages?chat_id=${chatId}`, {
      method: 'POST',
      headers: {
        'Authorization': botToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text.slice(0, 4000),
        format: 'markdown',
        notify: true,
      }),
      signal: AbortSignal.timeout(10000),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      logger.error({ chatId, error: data.error || data.message, status: res.status }, 'Max send failed');
      return false;
    }
    return true;
  } catch (err) {
    logger.error({ chatId, error: err.message }, 'Max send error');
    return false;
  }
}
