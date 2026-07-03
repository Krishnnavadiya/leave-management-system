import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { loginValidator } from '../middlewares/validators';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const controller = new AuthController();

router.post('/login', loginValidator, validateRequest, controller.login);
router.post('/logout', controller.logout);
router.post('/refresh-token', controller.refreshToken);

export default router;
