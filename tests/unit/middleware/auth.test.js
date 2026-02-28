import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

const { mockGetUser, mockFrom } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock('../../../db/supabase.js', () => ({
  supabaseAdmin: {
    auth: { getUser: mockGetUser },
    from: mockFrom,
  },
  supabaseAnon: null,
}));

import { authMiddleware } from '../../../middleware/auth.js';

function makeCtx(authHeader) {
  const req = { headers: { authorization: authHeader } };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SUPERADMIN_EMAIL = 'admin@test.com';
  });

  it('returns 401 when Authorization header is missing', async () => {
    const { req, res, next } = makeCtx(undefined);
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token is invalid', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'invalid' } });
    const { req, res, next } = makeCtx('Bearer bad-token');
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next() and sets req.clinic=null for superadmin', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '1', email: 'admin@test.com' } }, error: null });
    const { req, res, next } = makeCtx('Bearer valid-token');
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.clinic).toBeNull();
  });

  it('superadmin check is case-insensitive', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '1', email: 'ADMIN@TEST.COM' } }, error: null });
    const { req, res, next } = makeCtx('Bearer valid-token');
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.clinic).toBeNull();
  });

  it('returns 403 when user has no associated clinic', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: '2', email: 'user@clinic.com' } }, error: null });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: null, error: { message: 'not found' } }) }) }),
    });
    const { req, res, next } = makeCtx('Bearer valid-token');
    await authMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'No clinic associated with this account' });
  });

  it('calls next() and sets req.clinic for regular user with clinic', async () => {
    const clinic = { id: 'clinic-1', name: 'Test Clinic' };
    mockGetUser.mockResolvedValue({ data: { user: { id: '3', email: 'owner@clinic.com' } }, error: null });
    mockFrom.mockReturnValue({
      select: () => ({ eq: () => ({ single: () => ({ data: clinic, error: null }) }) }),
    });
    const { req, res, next } = makeCtx('Bearer valid-token');
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.clinic).toEqual(clinic);
  });
});
