import { Role } from '../config/enums';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        name: string;
      };
    }
  }
}
