import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  private authService = new AuthService();

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      // Set httpOnly cookies for extra security
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 minutes
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          employee: result.employee,
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      let refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (refreshToken) {
        await this.authService.logout(refreshToken);
      }

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');

      return res.status(200).json({
        success: true,
        message: 'Logout successful',
        data: null,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies.refreshToken;

      if (!refreshToken) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token is required',
          data: null,
          errors: null,
        });
      }

      const result = await this.authService.refresh(refreshToken);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        },
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };
}
