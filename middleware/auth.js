import { supabaseAnon } from '../db/supabase.js';
import { supabaseAdmin } from '../db/supabase.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  const token = authHeader.slice(7);

  try {
    if (!supabaseAdmin) {
      return res.status(503).json({ error: 'Database not configured' });
    }

    // Verify JWT and get user
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Find clinic for this user
    const { data: clinic, error: clinicError } = await supabaseAdmin
      .from('clinics')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (clinicError || !clinic) {
      return res.status(403).json({ error: 'No clinic associated with this account' });
    }

    req.user = user;
    req.clinic = clinic;
    req.token = token;
    next();
  } catch (err) {
    logger.error({ error: err.message }, 'Auth middleware error');
    res.status(500).json({ error: 'Internal server error' });
  }
}
