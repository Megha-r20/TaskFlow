import crypto from 'crypto';

// Generate cryptographically secure random token (hex string)
export function generateSecureToken(byteLength = 32) {
  return crypto.randomBytes(byteLength).toString('hex');
}

// Generate SHA-256 hash of a sensitive token before saving in database
export function hashToken(token) {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Constant time string comparison to prevent timing attacks
export function safeEqual(a, b) {
  if (!a || !b || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}
