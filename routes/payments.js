import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { supabaseAdmin } from '../db/supabase.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();
const router = Router();

/**
 * POST /api/payments/create
 * Create a subscription payment (stub — payment provider integration in Phase 6).
 */
router.post('/create', authMiddleware, async (req, res) => {
  const { plan_id, provider } = req.body;

  if (!plan_id || !provider) {
    return res.status(400).json({ error: 'Missing plan_id or provider' });
  }

  try {
    // Get plan price
    const { data: plan } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', plan_id)
      .single();

    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    // Create payment record
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        clinic_id: req.clinic.id,
        provider,
        amount_rub: plan.price_monthly_rub,
        plan_id,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    eventBus.emit('payment.initiated', { clinic_id: req.clinic.id, payment_id: payment.id });

    // TODO: Integrate with actual payment provider (YooKassa/Stripe)
    res.json({
      payment_id: payment.id,
      amount_rub: plan.price_monthly_rub,
      status: 'pending',
      message: 'Payment provider integration pending',
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Payment create error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/payments/topup
 * Top up prepaid balance (for overage tariffs).
 */
router.post('/topup', authMiddleware, async (req, res) => {
  const { amount_rub, provider } = req.body;

  if (!amount_rub || amount_rub < 10000) { // min 100 RUB = 10000 kopeks
    return res.status(400).json({ error: 'Minimum top-up is 100 RUB' });
  }

  try {
    const { data: payment, error } = await supabaseAdmin
      .from('payments')
      .insert({
        clinic_id: req.clinic.id,
        provider: provider || 'manual',
        amount_rub,
        status: 'pending',
        metadata: { type: 'topup' },
      })
      .select()
      .single();

    if (error) return res.status(400).json({ error: error.message });

    // TODO: Integrate with payment provider
    res.json({
      payment_id: payment.id,
      amount_rub,
      status: 'pending',
    });
  } catch (err) {
    logger.error({ error: err.message }, 'Topup error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/status/:id
 */
router.get('/status/:id', authMiddleware, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', req.params.id)
      .eq('clinic_id', req.clinic.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Payment not found' });
    res.json(data);
  } catch (err) {
    logger.error({ error: err.message }, 'Payment status error');
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/payments/balance
 */
router.get('/balance', authMiddleware, async (req, res) => {
  res.json({ balance_rub: req.clinic.balance_rub || 0 });
});

export default router;
