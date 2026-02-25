import { Router } from 'express';
import { supabaseAdmin } from '../db/supabase.js';
import { authRateLimit } from '../middleware/rateLimit.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';
import { transliterate, findUniqueSlug } from '../services/slug.js';

const logger = createLogger();
const router = Router();

router.use(authRateLimit);

/**
 * POST /api/auth/register
 * Register a new clinic: create auth user + clinic row.
 */
router.post('/register', async (req, res) => {
  const { email, password, clinicName, slug: requestedSlug, phone, city } = req.body;

  if (!email || !password || !clinicName) {
    return res.status(400).json({ error: 'Заполните название, email и пароль' });
  }

  try {
    // Generate slug: use provided or transliterate from name
    let baseSlug = requestedSlug || transliterate(clinicName);
    if (baseSlug.length < 3) baseSlug = 'clinic';

    // Validate slug format
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
      logger.error({ email, error: authError.message }, 'Auth registration failed');
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
      })
      .select()
      .single();

    if (clinicError) {
      // Rollback: delete auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      logger.error({ email, slug, error: clinicError.message }, 'Clinic creation failed');
      return res.status(400).json({ error: clinicError.message });
    }

    eventBus.emit('clinic.registered', { clinic_id: clinic.id, email, slug });

    res.status(201).json({
      clinic: {
        id: clinic.id,
        name: clinic.name,
        slug: clinic.slug,
        plan_id: clinic.plan_id,
      },
      message: 'Registration successful. Please sign in.',
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Registration error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email/password → returns session tokens.
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Missing email or password' });
  }

  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }

    res.json({
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      expires_in: data.session.expires_in,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Login error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/reset-password
 * Send password reset email.
 */
router.post('/reset-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Missing email' });

  try {
    await supabaseAdmin.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://aiveterinar.ru/admin/reset-callback',
    });
    res.json({ message: 'Password reset email sent' });
  } catch (err) {
    logger.error({ error: err.message }, 'Reset password error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
