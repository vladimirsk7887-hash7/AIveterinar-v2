import { createLogger } from '../services/logger.js';

const logger = createLogger();

export function superadminMiddleware(req, res, next) {
  const superadminEmail = process.env.SUPERADMIN_EMAIL;

  if (!superadminEmail) {
    return res.status(503).json({ error: 'Superadmin not configured' });
  }

  if (!req.user || req.user.email !== superadminEmail) {
    logger.warn({ email: req.user?.email }, 'Unauthorized superadmin access attempt');
    return res.status(403).json({ error: 'Access denied' });
  }

  next();
}
