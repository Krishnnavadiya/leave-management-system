import { Request, Response, NextFunction } from 'express';
import { ManagerService } from '../services/manager.service';
import { LeaveStatus, LeaveType } from '../config/enums';

export class ManagerController {
  private managerService = new ManagerService();

  getPendingLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { leaveType, search, page, limit } = req.query;

      const result = await this.managerService.getPendingLeaves({
        leaveType: leaveType as LeaveType,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'Pending leaves retrieved successfully',
        data: result,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  getAllLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeId, status, leaveType, startDate, endDate, search, page, limit } = req.query;

      const result = await this.managerService.getAllLeaves({
        employeeId: employeeId as string,
        status: status as LeaveStatus,
        leaveType: leaveType as LeaveType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        search: search as string,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'All leaves retrieved successfully',
        data: result,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  approveLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const managerId = req.user!.id;
      const { comment } = req.body;

      const leave = await this.managerService.approveLeave(id, managerId, comment);

      return res.status(200).json({
        success: true,
        message: 'Leave request approved successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  rejectLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const managerId = req.user!.id;
      const { comment } = req.body;

      const leave = await this.managerService.rejectLeave(id, managerId, comment);

      return res.status(200).json({
        success: true,
        message: 'Leave request rejected successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };
}
