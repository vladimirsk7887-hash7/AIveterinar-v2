import { Router } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabase.js';
import { encrypt } from '../services/crypto.js';
import { getClinicAnalytics } from '../services/analytics.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

router.use(authMiddleware);

/** GET /api/clinic */
router.get('/', (req, res) => {
  const { tg_bot_token_encrypted, auth_user_id, ...clinic } = req.clinic;
  res.json(clinic);
});

/** PUT /api/clinic */
router.put('/', async (req, res) => {
  const allowed = ['name', 'phone', 'city', 'address', 'ai_provider', 'ai_model', 'custom_prompt', 'welcome_message', 'settings'];
  const updates = {};
  for (const f of allowed) if (req.body[f] !== undefined) updates[f] = req.body[f];
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No valid fields' });

  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabaseAdmin
    .from('clinics').update(updates).eq('id', req.clinic.id).select().single();
  if (error) return res.status(400).json({ error: error.message });

  eventBus.emit('clinic.settings_updated', { clinic_id: req.clinic.id });
  res.json(data);
});

/** PUT /api/clinic/branding */
router.put('/branding', async (req, res) => {
  const { primary_color, bg_color, logo_url, welcome_message, system_prompt } = req.body;
  const brandingUpdate = {};
  if (primary_color !== undefined) brandingUpdate.primary_color = primary_color;
  if (bg_color !== undefined) brandingUpdate.bg_color = bg_color;
  if (logo_url !== undefined) brandingUpdate.logo_url = logo_url;
  if (welcome_message !== undefined) brandingUpdate.welcome_message = welcome_message;
  if (system_prompt !== undefined) brandingUpdate.system_prompt = system_prompt;

  const currentSettings = req.clinic.settings || {};
  const newSettings = { ...currentSettings, branding: { ...(currentSettings.branding || {}), ...brandingUpdate } };

  const { data, error } = await supabaseAdmin
    .from('clinics').update({ settings: newSettings, updated_at: new Date().toISOString() })
    .eq('id', req.clinic.id)
    .select('settings').single();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ branding: data.settings?.branding || {} });
});

// Image magic byte signatures — validates actual file content, not client-supplied MIME type
const MAGIC = {
  'image/jpeg': [0xFF, 0xD8, 0xFF],
  'image/png':  [0x89, 0x50, 0x4E, 0x47],
  'image/gif':  [0x47, 0x49, 0x46],
  'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header (WEBP follows at offset 8)
};

/** POST /api/clinic/logo — upload logo image to Supabase Storage */
router.post('/logo', upload.single('logo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не выбран' });
  const buf = req.file.buffer;
  const detectedType = Object.entries(MAGIC).find(([, sig]) => sig.every((b, i) => buf[i] === b))?.[0];
  if (!detectedType) {
    return res.status(400).json({ error: 'Допустимые форматы: JPG, PNG, GIF, WebP' });
  }
  const ext = detectedType.split('/')[1];
  const path = `${req.clinic.id}/logo.${ext}`;

  await supabaseAdmin.storage.createBucket('logos', { public: true }).catch(() => {});

  const { error } = await supabaseAdmin.storage
    .from('logos')
    .upload(path, req.file.buffer, { contentType: detectedType, upsert: true });
  if (error) return res.status(400).json({ error: error.message });

  const { data: { publicUrl } } = supabaseAdmin.storage.from('logos').getPublicUrl(path);
  res.json({ url: publicUrl });
});

/** PUT /api/clinic/telegram — save Telegram bot token (encrypted) and chat ID */
router.put('/telegram', async (req, res) => {
  const { tg_bot_token, tg_chat_id } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (tg_bot_token?.trim()) updates.tg_bot_token_encrypted = encrypt(tg_bot_token.trim());
  if (tg_chat_id?.trim()) updates.tg_chat_ids = [tg_chat_id.trim()];
  if (Object.keys(updates).length === 1) return res.status(400).json({ error: 'Nothing to update' });
  const { error } = await supabaseAdmin.from('clinics').update(updates).eq('id', req.clinic.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

/** PUT /api/clinic/max — save Max bot token (encrypted) and chat ID */
router.put('/max', async (req, res) => {
  const { max_bot_token, max_chat_id } = req.body;
  const updates = { updated_at: new Date().toISOString() };
  if (max_bot_token?.trim()) updates.max_bot_token_encrypted = encrypt(max_bot_token.trim());
  if (max_chat_id?.trim()) updates.max_chat_id = max_chat_id.trim();
  if (Object.keys(updates).length === 1) return res.status(400).json({ error: 'Nothing to update' });
  const { error } = await supabaseAdmin.from('clinics').update(updates).eq('id', req.clinic.id);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ ok: true });
});

/** GET /api/clinic/widget-code */
router.get('/widget-code', (req, res) => {
  const slug = req.clinic.slug;
  const host = process.env.APP_URL || 'https://vetai24.ru';
  res.json({
    slug,
    code: `<!-- AI-Ветеринар Widget -->\n<script src="${host}/widget-loader.js" data-slug="${slug}"></script>`,
  });
});

/** GET /api/clinic/conversations */
router.get('/conversations', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const { data, error, count } = await supabaseAdmin
    .from('conversations').select('*', { count: 'exact' })
    .eq('clinic_id', req.clinic.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) return res.status(400).json({ error: error.message });
  res.json({ data, total: count, page, limit });
});

/** GET /api/clinic/conversations/:id */
router.get('/conversations/:id', async (req, res) => {
  const { data: conversation, error } = await supabaseAdmin
    .from('conversations').select('*')
    .eq('id', req.params.id).eq('clinic_id', req.clinic.id).single();
  if (error || !conversation) return res.status(404).json({ error: 'Not found' });

  const { data: messages } = await supabaseAdmin
    .from('messages').select('*')
    .eq('conversation_id', req.params.id)
    .order('created_at', { ascending: true });
  res.json({ ...conversation, messages: messages || [] });
});

/** GET /api/clinic/appointments */
router.get('/appointments', async (req, res) => {
  let query = supabaseAdmin
    .from('appointments').select('*')
    .eq('clinic_id', req.clinic.id)
    .order('created_at', { ascending: false });
  if (req.query.status) query = query.eq('status', req.query.status);

  const { data, error } = await query;
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/** PUT /api/clinic/appointments/:id */
router.put('/appointments/:id', async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Missing status' });

  const { data, error } = await supabaseAdmin
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).eq('clinic_id', req.clinic.id)
    .select().single();
  if (error) return res.status(400).json({ error: error.message });

  eventBus.emit('appointment.status_changed', { clinic_id: req.clinic.id, appointment_id: req.params.id, status });
  res.json(data);
});

/** GET /api/clinic/analytics */
router.get('/analytics', async (req, res) => {
  const analytics = await getClinicAnalytics(supabaseAdmin, req.clinic.id, { from: req.query.from, to: req.query.to });
  res.json(analytics);
});

/** GET /api/clinic/usage */
router.get('/usage', async (req, res) => {
  const { data, error } = await supabaseAdmin
    .from('api_usage').select('*')
    .eq('clinic_id', req.clinic.id)
    .order('month', { ascending: false }).limit(12);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

/** POST /api/clinic/setup-request */
router.post('/setup-request', async (req, res) => {
  const { phone, preferredTime, comment } = req.body;
  if (!phone) return res.status(400).json({ error: 'Укажите телефон' });

  try {
    // Save onboarding choice
    const settings = { ...(req.clinic.settings || {}), onboarding: 'requested' };
    await supabaseAdmin
      .from('clinics').update({ settings, updated_at: new Date().toISOString() })
      .eq('id', req.clinic.id);

    // Emit event (saved to events table by events service)
    eventBus.emit('setup.requested', {
      clinic_id: req.clinic.id,
      clinic_name: req.clinic.name,
      email: req.clinic.email,
      phone,
      preferredTime: preferredTime || null,
      comment: comment || null,
    });

    // Notify superadmin via Telegram (if configured)
    const tgToken = process.env.TG_BOT_TOKEN;
    const tgChat = process.env.SUPERADMIN_TG_CHAT_ID || process.env.TG_CHAT_ID;
    if (tgToken && tgChat) {
      const text = `🔔 Заявка на настройку\n\nКлиника: ${req.clinic.name}\nEmail: ${req.clinic.email}\nТелефон: ${phone}${preferredTime ? `\nВремя: ${preferredTime}` : ''}${comment ? `\nКомментарий: ${comment}` : ''}`;
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: tgChat, text, parse_mode: 'HTML' }),
      }).catch((err) => logger.error({ error: err.message }, 'Failed to send setup request to Telegram'));
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ error: err.message }, 'Setup request error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/** GET /api/clinic/events */
router.get('/events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const { data, error } = await supabaseAdmin
    .from('events').select('*')
    .eq('clinic_id', req.clinic.id)
    .order('created_at', { ascending: false }).limit(limit);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

export default router;
