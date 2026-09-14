// Token bucket in-memory rate limiter for server routes
const tracker = new Map();

// Clean up old entries every 10 minutes to prevent memory accumulation
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of tracker.entries()) {
    if (now > data.resetTime) {
      tracker.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function rateLimit({ ip = 'global', limit = 60, windowMs = 60 * 1000 }) {
  const now = Date.now();
  const record = tracker.get(ip) || { count: 0, resetTime: now + windowMs };

  if (now > record.resetTime) {
    record.count = 0;
    record.resetTime = now + windowMs;
  }

  record.count += 1;
  tracker.set(ip, record);

  const remaining = Math.max(0, limit - record.count);
  const success = record.count <= limit;

  return {
    success,
    limit,
    remaining,
    resetTime: record.resetTime,
  };
}

export function getClientIp(req) {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}
