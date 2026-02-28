import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import healthRouter from '../../routes/health.js';

// health.js has no DB dependencies — test it directly
const app = express();
app.use('/api', healthRouter);

describe('GET /api/health', () => {
  it('returns 200 with status: ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBeDefined();
    expect(res.body.timestamp).toBeDefined();
  });

  it('includes services object', async () => {
    const res = await request(app).get('/api/health');
    expect(res.body.services).toBeDefined();
    expect(typeof res.body.services.supabase).toBe('boolean');
    expect(typeof res.body.services.telegram).toBe('boolean');
  });

  it('timestamp is a valid ISO string', async () => {
    const res = await request(app).get('/api/health');
    expect(() => new Date(res.body.timestamp)).not.toThrow();
    expect(new Date(res.body.timestamp).toISOString()).toBe(res.body.timestamp);
  });
});
