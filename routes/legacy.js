import { Router } from 'express';
import crypto from 'crypto';
import { callAI } from '../providers/ai/router.js';

const router = Router();

const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TG_CHAT_ID || '-5263363292';

// Chat proxy — routes through configured AI provider (RouterAI by default)
router.post('/chat', async (req, res) => {
  try {
    const { messages, system, max_tokens } = req.body;
    const result = await callAI({
      messages,
      system: system || 'You are a helpful assistant.',
      maxTokens: max_tokens || 1000,
    });
    res.json({ text: result.text });
  } catch (err) {
    console.error('Chat error:', err.message, err.cause || '');
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// Telegram Send (legacy, single-tenant)
router.post('/telegram', async (req, res) => {
  if (!TG_BOT_TOKEN) {
    return res.status(500).json({ error: 'TG_BOT_TOKEN not configured' });
  }
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Missing text' });

    const tgRes = await fetch(`https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text.slice(0, 4000),
        parse_mode: 'HTML',
      }),
    });
    const tgData = await tgRes.json();
    if (!tgData.ok) {
      return res.status(502).json({ error: tgData.description });
    }
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: 'Telegram error' });
  }
});

// Telegram initData validation (legacy)
router.post('/validate-tg', (req, res) => {
  if (!TG_BOT_TOKEN) {
    return res.status(500).json({ error: 'TG_BOT_TOKEN not configured' });
  }
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ valid: false });

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');

    const dataCheckString = Array.from(params.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n');

    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(TG_BOT_TOKEN).digest();
    const expected = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    res.json({ valid: hash === expected });
  } catch {
    res.json({ valid: false });
  }
});

export default router;
