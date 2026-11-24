// Small in-memory rate limiter. On Vercel each running instance keeps its own
// counts, so this slows down abuse rather than blocking it completely.
function rateLimit({ windowMs, max, message }) {
  const hits = new Map();
  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || (req.headers["x-forwarded-for"] || "").split(",")[0] || "unknown";
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
    } else if (++entry.count > max) {
      return res.status(429).json({ message: message || "Too many requests. Please wait a few minutes." });
    }
    if (hits.size > 5000) {
      for (const [k, v] of hits) if (now - v.start > windowMs) hits.delete(k);
    }
    next();
  };
}

module.exports = { rateLimit };
