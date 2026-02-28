import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const { mockFrom, mockCreateTenantClient } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockCreateTenantClient: vi.fn(() => ({})),
}));

vi.mock('../../../db/supabase.js', () => ({
  supabaseAdmin: { from: mockFrom },
  createTenantClient: mockCreateTenantClient,
}));

import { tenantMiddleware } from '../../../middleware/tenant.js';

function makeCtx(slug) {
  const req = { params: { slug } };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('tenantMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret-must-be-32-chars!!';
  });

  it('returns 400 when slug is missing', async () => {
    const { req, res, next } = makeCtx(undefined);
    await tenantMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 404 when clinic not found', async () => {
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: 'not found' } }) }) }),
    });
    const { req, res, next } = makeCtx('unknown-clinic');
    await tenantMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when clinic is inactive', async () => {
    mockFrom.mockReturnValue({
      select: () => ({
        eq: () => ({ single: () => ({ data: { id: '1', is_active: false }, error: null }) }),
      }),
    });
    const { req, res, next } = makeCtx('inactive-clinic');
    await tenantMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('calls next() and attaches clinic + supabase client for active clinic', async () => {
    const clinic = { id: 'clinic-1', is_active: true, slug: 'lapki' };
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: clinic, error: null }) }) }),
    });
    const { req, res, next } = makeCtx('lapki');
    await tenantMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.clinic).toEqual(clinic);
    expect(req.supabase).toBeDefined();
    expect(mockCreateTenantClient).toHaveBeenCalled();
  });
});
