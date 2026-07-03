import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorMiddleware = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = 'Internal Server Error';
  let errors: any = null;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.errors;
  } else {
    // Log unexpected errors
    console.error('UNEXPECTED ERROR:', err);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    errors,
  });
};
