import { LeaveRepository, LeaveQueryParams } from '../repositories/leave.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { BadRequestError, NotFoundError } from '../utils/errors';
import { LeaveStatus, LeaveType } from '../config/enums';

export class ManagerService {
  private leaveRepo = new LeaveRepository();
  private employeeRepo = new EmployeeRepository();
  private auditLogRepo = new AuditLogRepository();

  async getAllLeaves(params: LeaveQueryParams & { page?: number; limit?: number }) {
    const limit = params.limit || 10;
    const page = params.page || 1;
    const skip = (page - 1) * limit;

    const { leaves, total } = await this.leaveRepo.findAll({
      ...params,
      skip,
      take: limit,
    });

    return {
      leaves,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getPendingLeaves(params: Omit<LeaveQueryParams, 'status'> & { page?: number; limit?: number }) {
    return this.getAllLeaves({
      ...params,
      status: LeaveStatus.PENDING,
    });
  }

  async approveLeave(id: string, _managerId: string, comment?: string) {
    const leave = await this.leaveRepo.findById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestError(`Cannot approve leave. Current status: ${leave.status}`);
    }

    const employee = await this.employeeRepo.findById(leave.employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Deduct leave balance if not unpaid leave
    if (leave.leaveType !== LeaveType.UNPAID) {
      if (employee.leaveBalance < leave.totalDays) {
        throw new BadRequestError(
          `Cannot approve leave. Employee has insufficient balance (${employee.leaveBalance} days left, requested ${leave.totalDays} days)`
        );
      }
      const newBalance = employee.leaveBalance - leave.totalDays;
      await this.employeeRepo.updateLeaveBalance(leave.employeeId, newBalance);
    }

    const approvedLeave = await this.leaveRepo.update(id, {
      status: LeaveStatus.APPROVED,
      managerComment: comment || 'Approved by Manager',
    });

    // Write audit log
    await this.auditLogRepo.create({
      action: 'LEAVE_APPROVAL',
      details: `Approved ${leave.leaveType} leave request of ${leave.totalDays} days. Manager Comment: ${comment || 'N/A'}`,
      employeeId: leave.employeeId,
    });

    return approvedLeave;
  }

  async rejectLeave(id: string, _managerId: string, comment?: string) {
    const leave = await this.leaveRepo.findById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestError(`Cannot reject leave. Current status: ${leave.status}`);
    }

    const rejectedLeave = await this.leaveRepo.update(id, {
      status: LeaveStatus.REJECTED,
      managerComment: comment || 'Rejected by Manager',
    });

    // Write audit log
    await this.auditLogRepo.create({
      action: 'LEAVE_REJECTION',
      details: `Rejected ${leave.leaveType} leave request. Manager Comment: ${comment || 'N/A'}`,
      employeeId: leave.employeeId,
    });

    return rejectedLeave;
  }
}
