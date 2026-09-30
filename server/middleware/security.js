import rateLimit from 'express-rate-limit';

// Removes keys like "$ne" or "a.b" from req.body / req.query / req.params.
// Stops NoSQL injection such as {"email": {"$gt": ""}}.
const clean = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  for (const k of Object.keys(obj)) {
    if (k.startsWith('$') || k.includes('.')) delete obj[k];
    else clean(obj[k]);
  }
  return obj;
};
export const sanitizeInput = (req, res, next) => {
  clean(req.body); clean(req.query); clean(req.params);
  next();
};

const make = (windowMin, max, message) => rateLimit({
  windowMs: windowMin * 60 * 1000,
  max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message },
});

export const globalLimiter = make(15, 600, 'Too many requests. Please slow down.');
export const authLimiter = make(15, 12, 'Too many login attempts. Try again in 15 minutes.');
export const aiLimiter = make(60, 30, 'AI limit reached. Try again later.');
export const writeLimiter = make(15, 60, 'Too many actions. Please slow down.');
