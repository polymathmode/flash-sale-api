import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import ApiError from '../utils/ApiError';

/**
 * Error handling middleware
 */
export const errorHandler = (
  err: Error |  ApiError, 
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  console.error(err);

  // Check if error is a mongoose validation error
  if (err instanceof mongoose.Error.ValidationError) {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      success: false,
      error: messages.join(', ')
    });
  }

  // Check if error is a custom API error
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Default to 500 server error
  return res.status(500).json({
    success: false,
    error: 'Server Error'
  });
};


