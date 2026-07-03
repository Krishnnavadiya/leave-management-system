import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate, restrictTo } from '../middlewares/auth.middleware';
import { Role } from '../config/enums';

const router = Router();
const controller = new EmployeeController();

router.get('/profile', authenticate, controller.getProfile);
router.get('/', authenticate, restrictTo(Role.MANAGER), controller.getEmployees);
router.get('/:id', authenticate, controller.getEmployeeById);

export default router;
