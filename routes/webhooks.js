import { Router } from 'express';
import express from 'express';
import { supabaseAdmin } from '../db/supabase.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();
const router = Router();

// Official YooKassa IP ranges (https://yookassa.ru/developers/using-api/webhooks)
const YK_PREFIXES = ['185.71.76.', '185.71.77.', '77.75.153.', '77.75.154.'];

/**
 * POST /api/webhooks/yookassa
 * YooKassa payment confirmation callback.
 */
router.post('/yookassa', express.raw({ type: 'application/json' }), async (req, res) => {
  const ip = req.ip || '';
  if (!YK_PREFIXES.some(p => ip.startsWith(p))) {
    logger.warn({ ip }, 'YooKassa webhook: IP not in allowlist');
    return res.status(403).json({ error: 'Forbidden' });
  }
  try {
    const event = JSON.parse(req.body.toString());
    const paymentId = event.object?.metadata?.payment_id;

    if (event.event === 'payment.succeeded' && paymentId) {
      const { data: payment } = await supabaseAdmin
        .from('payments')
        .select('*')
        .eq('id', paymentId)
        .single();

      if (payment && payment.status === 'pending') {
        await supabaseAdmin
          .from('payments')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', paymentId);

        // If topup — atomic increment via RPC (avoids race condition on retry)
        if (payment.metadata?.type === 'topup') {
          await supabaseAdmin.rpc('topup_clinic_balance', {
            p_clinic_id: payment.clinic_id,
            p_amount: payment.amount_rub,
          });
        }

        // If subscription — update plan
        if (payment.plan_id) {
          await supabaseAdmin
            .from('clinics')
            .update({
              plan_id: payment.plan_id,
              plan_started_at: new Date().toISOString(),
              plan_expires_at: new Date(Date.now() + 30 * 86400000).toISOString(),
            })
            .eq('id', payment.clinic_id);
        }

        eventBus.emit('payment.completed', {
          clinic_id: payment.clinic_id,
          payment_id: paymentId,
          amount_rub: payment.amount_rub,
        });
      }
    }

    res.json({ ok: true });
  } catch (err) {
    logger.error({ error: err.message }, 'YooKassa webhook error');
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * POST /api/webhooks/stripe
 * Stripe payment confirmation callback (stub).
 */
router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  // TODO: Verify Stripe webhook signature
  logger.info('Stripe webhook received (not yet implemented)');
  res.json({ ok: true });
});

export default router;
