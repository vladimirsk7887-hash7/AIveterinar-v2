import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { loadConfig } from './config/loader.js';
import { createLogger } from './services/logger.js';
import { setupEventListeners } from './services/events.js';
import { startGarbageCollection } from './services/gc.js';
import { requestId } from './middleware/requestId.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load config first
let config;
try {
  config = loadConfig();
} catch (err) {
  console.error('Failed to load config:', err.message);
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 3000;
const logger = createLogger();

// Trust nginx proxy (fixes X-Forwarded-For for rate limiting)
app.set('trust proxy', 1);

// ─── CORS ───
// Widget is embedded in third-party sites → open CORS
// All other API routes are restricted to own origin
const widgetCors = cors();
const apiCors = cors({
  origin: process.env.APP_URL || 'https://vetai24.ru',
  credentials: true,
});

// ─── Global middleware ───
app.use(helmet({ contentSecurityPolicy: false }));
app.use(requestId);
app.use(express.json({ limit: '100kb' }));

// ─── Static files (Vite build output) ───
app.use(express.static(join(__dirname, 'dist'), { index: false }));

// ─── API Routes ───
import healthRouter from './routes/health.js';
app.use('/api', apiCors, healthRouter);

import legacyRouter from './routes/legacy.js';
app.use('/api', apiCors, legacyRouter);

import widgetRouter from './routes/widget.js';
app.use('/api/widget', widgetCors, widgetRouter);

import authRouter from './routes/auth.js';
app.use('/api/auth', apiCors, authRouter);

import clinicRouter from './routes/clinic.js';
app.use('/api/clinic', apiCors, clinicRouter);

import paymentsRouter from './routes/payments.js';
app.use('/api/payments', apiCors, paymentsRouter);

import webhooksRouter from './routes/webhooks.js';
app.use('/api/webhooks', webhooksRouter);

import adminRouter from './routes/admin.js';
app.use('/api/admin', apiCors, adminRouter);

import tgWebhookRouter from './routes/tg-webhook.js';
app.use('/api/tg-webhook', tgWebhookRouter);

// ─── SPA Fallbacks ───
const sendAdmin = (_req, res) => res.sendFile(join(__dirname, 'dist', 'admin.html'));
const sendSuper = (_req, res) => res.sendFile(join(__dirname, 'dist', 'superadmin.html'));
const sendWidget = (_req, res) => res.sendFile(join(__dirname, 'dist', 'widget.html'));
const sendTg = (_req, res) => res.sendFile(join(__dirname, 'dist', 'tg-mini-app.html'));
const sendLanding = (_req, res) => res.sendFile(join(__dirname, 'dist', 'landing.html'));

app.get('/admin', sendAdmin);
app.get('/admin/{*splat}', sendAdmin);

app.get('/super', sendSuper);
app.get('/super/{*splat}', sendSuper);

app.get('/widget/:slug', sendWidget);
app.get('/widget/:slug/{*splat}', sendWidget);

app.get('/tg', sendTg);
app.get('/tg/{*splat}', sendTg);

app.get('/landing', sendLanding);

// Root: landing page
app.get('/', sendLanding);

// Demo app (old) for any other path
app.get('/demo', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));
app.get('/demo/{*splat}', (_req, res) => res.sendFile(join(__dirname, 'dist', 'index.html')));

// Catch-all: landing
app.get('/{*splat}', sendLanding);

// ─── Event listeners + GC ───
setupEventListeners(config);
startGarbageCollection(config);

// ─── Start ───
app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV || 'development' }, 'AI-Vet SaaS server started');
  logger.info({
    supabase: !!process.env.SUPABASE_URL,
    ai_routerai: !!process.env.AI__ROUTERAI_API_KEY,
    telegram: !!process.env.TG_BOT_TOKEN,
  }, 'Service status');
});
