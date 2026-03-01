import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { superadminMiddleware } from '../middleware/superadmin.js';
import { supabaseAdmin } from '../db/supabase.js';
import { createLogger } from '../services/logger.js';
import { transliterate, findUniqueSlug } from '../services/slug.js';
import { eventBus } from '../services/events.js';
import { loadConfig } from '../config/loader.js';
import { getSettings, getApiKey, setSetting, setApiKey } from '../services/platformSettings.js';

const logger = createLogger();
const router = Router();

// All admin routes require auth + superadmin
router.use(authMiddleware);
router.use(superadminMiddleware);

/**
 * POST /api/admin/clinics
 * Concierge onboarding: superadmin creates a clinic on behalf of the vet.
 */
router.post('/clinics', async (req, res) => {
  const { clinicName, email, password, phone, city } = req.body;

  if (!clinicName || !email || !password) {
    return res.status(400).json({ error: 'Заполните название, email и пароль' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Пароль должен быть не менее 8 символов' });
  }

  try {
    let baseSlug = transliterate(clinicName);
    if (baseSlug.length < 3) baseSlug = 'clinic';
    if (!/^[a-z0-9-]{3,50}$/.test(baseSlug)) {
      baseSlug = baseSlug.replace(/[^a-z0-9-]/g, '').slice(0, 50);
      if (baseSlug.length < 3) baseSlug = 'clinic';
    }
    const slug = await findUniqueSlug(baseSlug);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      logger.error({ email, error: authError.message }, 'Admin: auth user creation failed');
      const msg = authError.message.includes('already been registered')
        ? 'Этот email уже зарегистрирован'
        : authError.message;
      return res.status(400).json({ error: msg });
    }

    // 2. Create clinic row
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .insert({
        auth_user_id: authData.user.id,
        name: clinicName,
        slug,
        email,
        phone: phone || null,
        city: city || null,
        settings: { onboarding: 'concierge' },
      })
      .select()
      .single();

    if (clinicError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      logger.error({ email, slug, error: clinicError.message }, 'Admin: clinic creation failed');
      return res.status(400).json({ error: clinicError.message });
    }

    eventBus.emit('clinic.registered', { clinic_id: clinic.id, email, slug, created_by: 'superadmin' });
    logger.info({ clinic_id: clinic.id, slug, email }, 'Admin: clinic created via concierge');

    res.set('Cache-Control', 'no-store');
    res.status(201).json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        email: clinic.email,
        plan_id: clinic.plan_id,
      },
      credentials: { email, password },
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Admin: clinic creation error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/clinics
 */
router.get('/clinics', async (_req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('id, name, slug, email, plan_id, is_active, balance_rub, created_at')
      .order('created_at', { ascending: false });

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Admin clinics list error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/clinics/:id
 */
router.get('/clinics/:id', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Clinic not found' });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Admin clinic detail error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/admin/clinics/:id
 * Admin actions: block/unblock, change plan, adjust balance.
 */
router.put('/clinics/:id', async (req, res) => {
  const { is_active, plan_id, balance_rub } = req.body;
  const updates = { updated_at: new Date().toISOString() };

  if (is_active !== undefined) updates.is_active = is_active;
  if (plan_id) updates.plan_id = plan_id;
  if (balance_rub !== undefined) updates.balance_rub = balance_rub;

  try {
    const { data, error } = await supabaseAdmin
      .from('clinics')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Admin clinic update error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/stats
 */
router.get('/stats', async (_req, res) => {
  try {
    const { count: totalClinics } = await supabaseAdmin
      .from('clinics')
      .select('*', { count: 'exact', head: true });

    const { count: activeClinics } = await supabaseAdmin
      .from('clinics')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    const { count: totalConversations } = await supabaseAdmin
      .from('conversations')
      .select('*', { count: 'exact', head: true });

    const { count: totalAppointments } = await supabaseAdmin
      .from('appointments')
      .select('*', { count: 'exact', head: true });

    res.json({
      clinics: { total: totalClinics, active: activeClinics },
      conversations: totalConversations,
      appointments: totalAppointments,
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Admin stats error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/events
 */
router.get('/events', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  try {
    const { data, error } = await supabaseAdmin
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Admin events error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/payments
 */
router.get('/payments', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 100, 500);
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*, clinics(name, slug)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) return res.status(400).json({ error: error.message });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Admin payments error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/admin/ai-providers
 * Returns status + masked keys for all configured AI providers.
 */
router.get('/ai-providers', async (_req, res) => {
  const config = loadConfig();
  const API_KEY_MAP = {
    routerai: 'AI__ROUTERAI_API_KEY',
    openrouter: 'AI__OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
  };

  const settings = await getSettings();
  const defaultProvider = settings['ai.default_provider'] || config.ai.default_provider;
  const defaultModel    = settings['ai.default_model']    || config.ai.default_model;

  const providers = await Promise.all(
    Object.entries(config.ai.providers).map(async ([id, cfg]) => {
      const envVar = API_KEY_MAP[id];
      const dbKey  = await getApiKey(id);
      const envKey = process.env[envVar] || '';
      const activeKey = dbKey || envKey;
      const hasKey = activeKey.length > 0;
      const maskedKey = hasKey
        ? `${activeKey.slice(0, 8)}...${activeKey.slice(-4)}`
        : null;
      const source = dbKey ? 'db' : (envKey ? 'env' : null);

      return {
        id,
        enabled: cfg.enabled,
        base_url: cfg.base_url,
        env_var: envVar,
        has_key: hasKey,
        masked_key: maskedKey,
        key_source: source,
        models: cfg.models || [],
      };
    })
  );

  res.json({
    default_provider: defaultProvider,
    default_model: defaultModel,
    providers,
  });
});

/**
 * PUT /api/admin/ai-providers/settings
 * Update default provider and/or default model.
 * Body: { default_provider?, default_model? }
 */
router.put('/ai-providers/settings', async (req, res) => {
  const { default_provider, default_model } = req.body;
  if (!default_provider && !default_model) {
    return res.status(400).json({ error: 'Provide default_provider and/or default_model' });
  }
  if (default_provider) await setSetting('ai.default_provider', default_provider);
  if (default_model)    await setSetting('ai.default_model', default_model);
  res.json({ ok: true });
});

/**
 * PUT /api/admin/ai-providers/:providerId/key
 * Store encrypted API key for a provider.
 * Body: { api_key }
 */
router.put('/ai-providers/:providerId/key', async (req, res) => {
  const { providerId } = req.params;
  const { api_key } = req.body;
  if (!api_key?.trim()) {
    return res.status(400).json({ error: 'api_key is required' });
  }
  const config = loadConfig();
  if (!config.ai.providers[providerId]) {
    return res.status(400).json({ error: `Unknown provider: ${providerId}` });
  }
  await setApiKey(providerId, api_key.trim());
  res.json({ ok: true });
});

/**
 * POST /api/admin/ai-providers/test
 * Test a provider with a minimal chat call.
 * Body: { provider_id, model_id }
 */
router.post('/ai-providers/test', async (req, res) => {
  const { provider_id, model_id } = req.body;
  if (!provider_id || !model_id) {
    return res.status(400).json({ error: 'Missing provider_id or model_id' });
  }

  const API_KEY_MAP = {
    routerai: 'AI__ROUTERAI_API_KEY',
    openrouter: 'AI__OPENROUTER_API_KEY',
    openai: 'OPENAI_API_KEY',
  };
  const BASE_URL_MAP = {
    routerai: 'https://routerai.ru/api/v1',
    openrouter: 'https://openrouter.ai/api/v1',
    openai: 'https://api.openai.com/v1',
  };

  const apiKey = (await getApiKey(provider_id).catch(() => null)) || process.env[API_KEY_MAP[provider_id]];
  if (!apiKey) {
    return res.status(400).json({ ok: false, error: 'API key not set' });
  }

  const baseUrl = BASE_URL_MAP[provider_id];
  const start = Date.now();

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model_id,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      }),
      signal: AbortSignal.timeout(15000),
    });

    const data = await response.json();
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return res.json({
        ok: false,
        status: response.status,
        error: data.error?.message || `HTTP ${response.status}`,
        latencyMs,
      });
    }

    res.json({
      ok: true,
      latencyMs,
      model: data.model,
      tokens: data.usage?.total_tokens || null,
    });
  } catch (err) {
    res.json({ ok: false, error: err.message, latencyMs: Date.now() - start });
  }
});

export default router;
