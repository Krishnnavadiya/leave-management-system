import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';
import { Role } from '../config/enums';

interface JwtPayload {
  id: string;
  email: string;
  role: Role;
  name: string;
}

export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  try {
    let token = '';

    // 1. Check Authorization Header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // 2. Check Cookie
    else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new UnauthorizedError('Access token is missing or invalid');
    }

    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    const decoded = jwt.verify(token, secret) as JwtPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      name: decoded.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Access token expired'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid access token'));
    } else {
      next(error);
    }
  }
};

export const restrictTo = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('You do not have permission to perform this action'));
    }

    next();
  };
};
