import { Router } from 'express';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    services: {
      supabase: !!process.env.SUPABASE_URL,
      ai_routerai: !!process.env.AI__ROUTERAI_API_KEY,
      ai_openrouter: !!process.env.AI__OPENROUTER_API_KEY,
      ai_openai: !!process.env.OPENAI_API_KEY,
      telegram: !!process.env.TG_BOT_TOKEN,
      yookassa: !!process.env.PAYMENTS__YOOKASSA__SHOP_ID,
      stripe: !!process.env.PAYMENTS__STRIPE__SECRET_KEY,
      superadmin_email_set: !!process.env.SUPERADMIN_EMAIL,
    },
  });
});

export default router;
