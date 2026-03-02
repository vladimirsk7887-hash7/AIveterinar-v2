import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../db/supabase.js';
import { createTenantClient } from '../db/supabase.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();

export async function tenantMiddleware(req, res, next) {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({ error: 'Missing clinic slug' });
  }

  if (!supabaseAdmin) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    // 1. Find clinic by slug (via service_role — single SELECT)
    const { data: clinic, error } = await supabaseAdmin
      .from('clinics')
      .select('id, is_active, plan_id, ai_provider, ai_model, balance_rub, tg_chat_ids, tg_bot_token_encrypted, max_bot_token_encrypted, max_chat_id, primary_color, secondary_color, welcome_message, custom_prompt, settings')
      .eq('slug', slug)
      .single();

    if (error || !clinic) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    if (!clinic.is_active) {
      return res.status(403).json({ error: 'Clinic is inactive' });
    }

    // 2. Sign Custom JWT (5 min TTL) with clinic_id in claims
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;
    if (!jwtSecret) {
      return res.status(503).json({ error: 'JWT secret not configured' });
    }

    const customToken = jwt.sign(
      {
        role: 'authenticated',
        clinic_id: clinic.id,
        exp: Math.floor(Date.now() / 1000) + 300,
      },
      jwtSecret
    );

    // 3. Per-request Supabase client with Custom JWT
    req.supabase = createTenantClient(customToken);
    req.clinic = clinic;
    next();
  } catch (err) {
    logger.error({ slug, error: err.message }, 'Tenant middleware error');
    res.status(500).json({ error: 'Internal server error' });
  }
}
