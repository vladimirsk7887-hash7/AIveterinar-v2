import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../../services/logger.js', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}));

import { superadminMiddleware } from '../../../middleware/superadmin.js';

function makeCtx(email) {
  const req = { user: email ? { email } : null };
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
  const next = vi.fn();
  return { req, res, next };
}

describe('superadminMiddleware', () => {
  beforeEach(() => {
    process.env.SUPERADMIN_EMAIL = 'admin@test.com';
  });

  it('calls next() for superadmin email (exact match)', () => {
    const { req, res, next } = makeCtx('admin@test.com');
    superadminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('calls next() for superadmin email (case-insensitive)', () => {
    const { req, res, next } = makeCtx('ADMIN@TEST.COM');
    superadminMiddleware(req, res, next);
    expect(next).toHaveBeenCalled();
  });

  it('returns 403 for non-superadmin user', () => {
    const { req, res, next } = makeCtx('other@user.com');
    superadminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Access denied' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 403 when req.user is null', () => {
    const { req, res, next } = makeCtx(null);
    superadminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 503 when SUPERADMIN_EMAIL is not set', () => {
    delete process.env.SUPERADMIN_EMAIL;
    const { req, res, next } = makeCtx('admin@test.com');
    superadminMiddleware(req, res, next);
    expect(res.status).toHaveBeenCalledWith(503);
    expect(res.json).toHaveBeenCalledWith({ error: 'Superadmin not configured' });
    process.env.SUPERADMIN_EMAIL = 'admin@test.com';
  });
});
