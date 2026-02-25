import { Router } from 'express';
import { tenantMiddleware } from '../middleware/tenant.js';
import { decrypt } from '../services/crypto.js';
import { processAIChat } from '../services/ai.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();
const router = Router();

/**
 * POST /api/tg-webhook/:slug
 * Incoming Telegram messages from clinic's own bot (Pro plan).
 */
router.post('/:slug', tenantMiddleware, async (req, res) => {
  const clinic = req.clinic;
  const update = req.body;

  // Decrypt bot token for this clinic
  let botToken;
  try {
    if (!clinic.tg_bot_token_encrypted) {
      return res.status(400).json({ error: 'No bot token configured for this clinic' });
    }
    botToken = decrypt(clinic.tg_bot_token_encrypted);
  } catch (err) {
    logger.error({ clinicId: clinic.id, error: err.message }, 'TG token decrypt failed');
    return res.status(500).json({ error: 'Token decryption failed' });
  }

  // Parse Telegram update
  const message = update.message || update.edited_message;
  if (!message?.text) {
    return res.json({ ok: true }); // Ignore non-text messages
  }

  const chatId = message.chat.id;
  const userId = message.from.id.toString();
  const text = message.text;

  // Handle /start command
  if (text === '/start') {
    await sendTgReply(botToken, chatId,
      clinic.welcome_message || 'Здравствуйте! Опишите, что беспокоит вашего питомца.'
    );
    return res.json({ ok: true });
  }

  try {
    // Process through AI
    const result = await processAIChat(req.supabase, clinic, {
      messages: [{ role: 'user', content: text }],
      system: clinic.custom_prompt || '',
    });

    if (result.error === 'limit_reached') {
      await sendTgReply(botToken, chatId, 'Лимит обращений исчерпан. Позвоните в клинику напрямую.');
      return res.json({ ok: true });
    }

    await sendTgReply(botToken, chatId, result.text);
    res.json({ ok: true });
  } catch (err) {
    logger.error({ clinicId: clinic.id, error: err.message }, 'TG webhook processing error');
    await sendTgReply(botToken, chatId, 'Извините, произошла ошибка. Попробуйте позже.');
    res.json({ ok: true });
  }
});

async function sendTgReply(botToken, chatId, text) {
  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text.slice(0, 4000),
        parse_mode: 'HTML',
      }),
    });
  } catch (err) {
    logger.error({ chatId, error: err.message }, 'TG reply failed');
  }
}

export default router;
