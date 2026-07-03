import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const validateRequest = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err: any) => ({
      field: err.path || err.param,
      message: err.msg,
    }));
    return next(new ValidationError('Input validation failed', formattedErrors));
  }
  next();
};
