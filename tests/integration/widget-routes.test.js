import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../services/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../middleware/rateLimit.js', () => ({
  widgetRateLimit: (_req, _res, next) => next(),
  authRateLimit: (_req, _res, next) => next(),
}));

const { mockFrom, mockCreateTenantClient } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockCreateTenantClient: vi.fn(() => ({ from: vi.fn() })),
}));

vi.mock('../../db/supabase.js', () => ({
  supabaseAdmin: { from: mockFrom },
  createTenantClient: mockCreateTenantClient,
}));

import widgetRouter from '../../routes/widget.js';

const app = express();
app.use(express.json());
app.use('/api/widget', widgetRouter);

const activeClinic = {
  id: 'clinic-1',
  is_active: true,
  slug: 'lapki',
  name: 'Лапки',
  settings: {
    branding: {
      primary_color: '#7C4DFF',
      bg_color: '#0B0E18',
      welcome_message: 'Привет!',
    },
  },
};

function mockClinicLookup(clinic) {
  mockFrom.mockReturnValue({
    select: () => ({
      eq: () => ({ single: () => ({ data: clinic, error: clinic ? null : { message: 'not found' } }) }),
    }),
  });
}

describe('GET /api/widget/:slug/config', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 404 for unknown slug', async () => {
    mockClinicLookup(null);
    const res = await request(app).get('/api/widget/unknown/config');
    expect(res.status).toBe(404);
  });

  it('returns 403 for inactive clinic', async () => {
    mockClinicLookup({ ...activeClinic, is_active: false });
    const res = await request(app).get('/api/widget/lapki/config');
    expect(res.status).toBe(403);
  });

  it('returns branding config for active clinic', async () => {
    mockClinicLookup(activeClinic);
    const res = await request(app).get('/api/widget/lapki/config');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Лапки');
    expect(res.body.primaryColor).toBe('#7C4DFF');
    expect(res.body.bgColor).toBe('#0B0E18');
    expect(res.body.welcomeMessage).toBe('Привет!');
  });

  it('returns null branding fields when not configured', async () => {
    mockClinicLookup({ ...activeClinic, settings: {} });
    const res = await request(app).get('/api/widget/lapki/config');
    expect(res.status).toBe(200);
    expect(res.body.primaryColor).toBeNull();
    expect(res.body.bgColor).toBeNull();
  });
});
