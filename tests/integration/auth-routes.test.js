import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

vi.mock('../../services/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

vi.mock('../../services/events.js', () => ({
  eventBus: { emit: vi.fn() },
  setupEventListeners: vi.fn(),
}));

vi.mock('../../middleware/rateLimit.js', () => ({
  authRateLimit: (_req, _res, next) => next(),
  widgetRateLimit: (_req, _res, next) => next(),
}));

const { mockCreateUser, mockSignIn, mockResetPwd, mockFrom } = vi.hoisted(() => ({
  mockCreateUser: vi.fn(),
  mockSignIn: vi.fn(),
  mockResetPwd: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../../db/supabase.js', () => ({
  supabaseAdmin: {
    auth: {
      admin: { createUser: mockCreateUser },
      resetPasswordForEmail: mockResetPwd,
    },
    from: mockFrom,
  },
  supabaseAnon: {
    auth: { signInWithPassword: mockSignIn },
  },
  createTenantClient: vi.fn(),
}));

import authRouter from '../../routes/auth.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('POST /api/auth/register', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'test@test.com' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('returns 400 when supabase auth creation fails', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ limit: () => ({ data: [] }) }) }),
    });
    mockCreateUser.mockResolvedValue({
      data: null,
      error: { message: 'User already been registered' },
    });
    const res = await request(app).post('/api/auth/register').send({
      email: 'dup@test.com',
      password: 'pass1234',
      clinicName: 'Тест Клиника',
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/зарегистрирован/i);
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when email or password missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x@x.com' });
    expect(res.status).toBe(400);
  });

  it('returns 401 when credentials are wrong', async () => {
    mockSignIn.mockResolvedValue({
      data: { session: null },
      error: { message: 'Invalid login credentials' },
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns 200 with tokens on successful login', async () => {
    mockSignIn.mockResolvedValue({
      data: {
        session: { access_token: 'tok', refresh_token: 'ref' },
        user: { id: '1', email: 'x@x.com' },
      },
      error: null,
    });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'x@x.com', password: 'correct' });
    expect(res.status).toBe(200);
    expect(res.body.access_token).toBe('tok');
  });
});

describe('POST /api/auth/reset-password', () => {
  it('returns 400 when email is missing', async () => {
    const res = await request(app).post('/api/auth/reset-password').send({});
    expect(res.status).toBe(400);
  });

  it('returns 200 on valid email', async () => {
    mockResetPwd.mockResolvedValue({ error: null });
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ email: 'user@clinic.com' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/sent/i);
  });
});
