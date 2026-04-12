/**
 * Security and HTTP middleware for Gas Surfer API.
 */

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

const isDev = process.env.NODE_ENV !== 'production';

/** Body parser limit (raw JSON). */
export const BODY_LIMIT = '16kb';

/** Apply Helmet security headers. */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  });
}

/** CORS: allow configured origins or dev defaults. */
export function corsOptions() {
  const env = process.env.ALLOWED_ORIGINS;
  const origins = env ? env.split(',').map((o) => o.trim()).filter(Boolean) : null;
  if (origins && origins.length > 0) {
    return cors({ origin: origins, credentials: true });
  }
  if (isDev) {
    return cors({
      origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
      ],
      credentials: true,
    });
  }
  return cors({ origin: false, credentials: false });
}

/** Rate limit for POST /api/samples (write). */
export const samplesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Rate limit for GET /api/averages (read). */
export const averagesRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Rate limit for POST /api/ticks (write). */
export const ticksRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 45,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** Rate limit for GET snapshot JSON. */
export const snapshotRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  message: { error: 'Too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});
