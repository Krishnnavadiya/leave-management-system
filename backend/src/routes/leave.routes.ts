import { Router } from 'express';
import { LeaveController } from '../controllers/leave.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { leaveApplicationValidator } from '../middlewares/validators';
import { validateRequest } from '../middlewares/validation.middleware';

const router = Router();
const controller = new LeaveController();

router.post('/', authenticate, leaveApplicationValidator, validateRequest, controller.applyLeave);
router.get('/', authenticate, controller.getEmployeeLeaves);
router.get('/:id', authenticate, controller.getLeaveById);
router.put('/:id', authenticate, leaveApplicationValidator, validateRequest, controller.editPendingLeave);
router.delete('/:id', authenticate, controller.deletePendingLeave);
router.put('/:id/cancel', authenticate, controller.cancelLeave);

export default router;
