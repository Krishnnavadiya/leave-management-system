import { Router } from 'express';
import { ManagerController } from '../controllers/manager.controller';
import { authenticate, restrictTo } from '../middlewares/auth.middleware';
import { reviewLeaveValidator } from '../middlewares/validators';
import { validateRequest } from '../middlewares/validation.middleware';
import { Role } from '../config/enums';

const router = Router();
const controller = new ManagerController();

router.get('/pending-leaves', authenticate, restrictTo(Role.MANAGER), controller.getPendingLeaves);
router.get('/leaves', authenticate, restrictTo(Role.MANAGER), controller.getAllLeaves);
router.put('/leaves/:id/approve', authenticate, restrictTo(Role.MANAGER), reviewLeaveValidator, validateRequest, controller.approveLeave);
router.put('/leaves/:id/reject', authenticate, restrictTo(Role.MANAGER), reviewLeaveValidator, validateRequest, controller.rejectLeave);

export default router;
