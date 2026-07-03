import { Request, Response, NextFunction } from 'express';
import { LeaveService } from '../services/leave.service';
import { LeaveStatus, LeaveType } from '../config/enums';

export class LeaveController {
  private leaveService = new LeaveService();

  applyLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.id;
      const { leaveType, startDate, endDate, reason } = req.body;

      const leave = await this.leaveService.applyLeave(employeeId, {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  getEmployeeLeaves = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req.user!.id;
      const { status, leaveType, startDate, endDate, page, limit } = req.query;

      const result = await this.leaveService.getEmployeeLeaves(employeeId, {
        status: status as LeaveStatus,
        leaveType: leaveType as LeaveType,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'Leaves retrieved successfully',
        data: result,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  getLeaveById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const requesterId = req.user!.id;
      const requesterRole = req.user!.role;

      const leave = await this.leaveService.getLeaveById(id, requesterId, requesterRole);

      return res.status(200).json({
        success: true,
        message: 'Leave details retrieved successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  editPendingLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employeeId = req.user!.id;
      const { leaveType, startDate, endDate, reason } = req.body;

      const leave = await this.leaveService.editPendingLeave(id, employeeId, {
        leaveType,
        startDate,
        endDate,
        reason,
      });

      return res.status(200).json({
        success: true,
        message: 'Leave request updated successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  deletePendingLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employeeId = req.user!.id;

      const result = await this.leaveService.deletePendingLeave(id, employeeId);

      return res.status(200).json({
        success: true,
        message: 'Leave request deleted successfully',
        data: result,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  cancelLeave = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employeeId = req.user!.id;

      const leave = await this.leaveService.cancelLeave(id, employeeId);

      return res.status(200).json({
        success: true,
        message: 'Leave request cancelled successfully',
        data: leave,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };
}
