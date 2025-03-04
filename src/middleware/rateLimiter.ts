import rateLimit from 'express-rate-limit';

// rate limiter for purchase requests to prevent abuse
export const purchaseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, 
  max: 10, 
  message: {
    success: false,
    error: 'Too many purchase attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// rate limiter for authentication attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});