import rateLimit from 'express-rate-limit';

// Widget API: 10 requests per minute per IP per slug
export const widgetRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.params.slug || 'global'}`,
  message: { error: 'Too many requests, please try again later' },
  validate: { keyGeneratorIpFallback: false },
});

// Auth API: 5 attempts per minute per IP
export const authRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts' },
  validate: { keyGeneratorIpFallback: false },
});
