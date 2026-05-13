import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { Site } from '../models/Site';

// Per-IP rate limit — applied first (no DB hit)
export const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, slow down.' },
});

function extractSiteToken(body: unknown): string | undefined {
  if (Array.isArray(body)) return (body[0] as any)?.site_token;
  return (body as any)?.site_token;
}

// Per-token rate limit — keyed on site_token
export const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 500,
  keyGenerator: (req) => {
    const token = extractSiteToken(req.body);
    if (token) return token;
    const ip = req.ip ?? req.socket?.remoteAddress ?? '';
    return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
  },
  validate: { keyGeneratorIpFallback: false },
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Token rate limit exceeded.' },
});

// Site token validation — DB lookup after rate limits pass
export async function validateSiteToken(req: Request, res: Response, next: NextFunction) {
  const token = extractSiteToken(req.body);

  if (!token) {
    return res.status(403).json({ error: 'Missing site token.' });
  }

  const site = await Site.findOne({ token }).lean();

  if (!site) {
    return res.status(403).json({ error: 'Invalid site token.' });
  }

  if (!site.active) {
    return res.status(403).json({ error: 'Site token has been revoked.' });
  }

  const origin = req.headers.origin;
  if (origin && origin !== site.allowed_origin) {
    return res.status(403).json({ error: 'Origin not allowed for this token.' });
  }

  next();
}
