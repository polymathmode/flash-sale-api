import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// Rate limiter for purchase requests to prevent abuse
export const purchaseLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    success: false,
    error: 'Too many purchase attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiter for authentication attempts
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login/register attempts per windowMs
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});