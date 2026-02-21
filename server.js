import express from 'express';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const TG_BOT_TOKEN = process.env.TG_BOT_TOKEN || '';
const TG_CHAT_ID = process.env.TG_CHAT_ID || '-5263363292';

app.use(express.json({ limit: '100kb' }));
app.use(express.static(join(__dirname, 'dist')));

// ─── Healthcheck ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', hasKey: !!OPENAI_API_KEY });
});

// ─── OpenAI Chat Proxy ───
app.post('/api/chat', async (req, res) => {
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
  }
  try {
    const { messages, system, max_tokens } = req.body;
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-5.2',
        max_completion_tokens: max_tokens || 1000,
        messages: [
          { role: 'system', content: system || 'You are a helpful assistant.' },
          ...messages,
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({ error: data.error?.message || 'OpenAI error' });
    }
    res.json({ text: data.choices?.[0]?.message?.content || '' });
  } catch (err) {
    console.error('Chat error:', err.message, err.cause || '');
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// ─── Telegram Send ───
app.post('/api/telegram', async (req, res) => {
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

// ─── Telegram initData validation ───
app.post('/api/validate-tg', (req, res) => {
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

// ─── Mini App SPA fallback ───
app.get('/tg/{*splat}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'tg-mini-app.html'));
});

// ─── Main SPA fallback ───
app.get('/{*splat}', (_req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`AI-Vet server running on port ${PORT}`);
  console.log(`OpenAI key: ${OPENAI_API_KEY ? 'configured' : 'MISSING'}`);
  console.log(`Telegram: ${TG_BOT_TOKEN ? 'configured' : 'not configured'}`);
});
