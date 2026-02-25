import { Router } from 'express';
import express from 'express';
import { supabaseAdmin } from '../db/supabase.js';
import { eventBus } from '../services/events.js';
import { createLogger } from '../services/logger.js';

const logger = createLogger();
const router = Router();

/**
 * POST /api/webhooks/yookassa
 * YooKassa payment confirmation callback.
 */
router.post('/yookassa', express.raw({ type: 'application/json' }), async (req, res) => {
  // TODO: Verify YooKassa webhook signature
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

        // If topup — add to balance
        if (payment.metadata?.type === 'topup') {
          const { data: clinic } = await supabaseAdmin
            .from('clinics')
            .select('balance_rub')
            .eq('id', payment.clinic_id)
            .single();

          await supabaseAdmin
            .from('clinics')
            .update({ balance_rub: (clinic?.balance_rub || 0) + payment.amount_rub })
            .eq('id', payment.clinic_id);
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
