import { LeaveRepository, LeaveQueryParams } from '../repositories/leave.repository';
import { EmployeeRepository } from '../repositories/employee.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors';
import { LeaveStatus, LeaveType, Role } from '../config/enums';

export class LeaveService {
  private leaveRepo = new LeaveRepository();
  private employeeRepo = new EmployeeRepository();
  private auditLogRepo = new AuditLogRepository();

  async applyLeave(
    employeeId: string,
    data: { leaveType: LeaveType; startDate: string; endDate: string; reason: string }
  ) {
    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid start or end date');
    }

    if (start > end) {
      throw new BadRequestError('Start date must be on or before end date');
    }

    const totalDays = this.calculateBusinessDays(start, end);
    if (totalDays <= 0) {
      throw new BadRequestError('Leave period must include at least one working day (Monday - Friday)');
    }

    // Unpaid leaves don't check or affect leaveBalance
    if (data.leaveType !== LeaveType.UNPAID && totalDays > employee.leaveBalance) {
      throw new BadRequestError(
        `Insufficient leave balance. Requested: ${totalDays} days, Available: ${employee.leaveBalance} days.`
      );
    }

    const leave = await this.leaveRepo.create({
      employeeId,
      leaveType: data.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: data.reason,
      status: LeaveStatus.PENDING,
    });

    await this.auditLogRepo.create({
      action: 'LEAVE_APPLICATION',
      details: `Applied for ${totalDays} days of ${data.leaveType} leave (Reason: ${data.reason})`,
      employeeId,
    });

    return leave;
  }

  async getEmployeeLeaves(employeeId: string, params: LeaveQueryParams & { page?: number; limit?: number }) {
    const limit = params.limit || 10;
    const page = params.page || 1;
    const skip = (page - 1) * limit;

    const { leaves, total } = await this.leaveRepo.findAll({
      ...params,
      employeeId,
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

  async getLeaveById(id: string, requesterId: string, requesterRole: Role) {
    const leave = await this.leaveRepo.findWithEmployeeById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (requesterRole !== Role.MANAGER && leave.employeeId !== requesterId) {
      throw new ForbiddenError('You are not authorized to view this leave request');
    }

    return leave;
  }

  async editPendingLeave(
    id: string,
    employeeId: string,
    data: { leaveType: LeaveType; startDate: string; endDate: string; reason: string }
  ) {
    const leave = await this.leaveRepo.findById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.employeeId !== employeeId) {
      throw new ForbiddenError('You can only edit your own leave requests');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestError('Only pending leave requests can be edited');
    }

    const employee = await this.employeeRepo.findById(employeeId);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestError('Invalid start or end date');
    }

    if (start > end) {
      throw new BadRequestError('Start date must be on or before end date');
    }

    const totalDays = this.calculateBusinessDays(start, end);
    if (totalDays <= 0) {
      throw new BadRequestError('Leave period must include at least one working day (Monday - Friday)');
    }

    if (data.leaveType !== LeaveType.UNPAID && totalDays > employee.leaveBalance) {
      throw new BadRequestError(
        `Insufficient leave balance. Requested: ${totalDays} days, Available: ${employee.leaveBalance} days.`
      );
    }

    const updatedLeave = await this.leaveRepo.update(id, {
      leaveType: data.leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      reason: data.reason,
    });

    await this.auditLogRepo.create({
      action: 'LEAVE_EDIT',
      details: `Modified pending leave request to ${totalDays} days of ${data.leaveType} leave`,
      employeeId,
    });

    return updatedLeave;
  }

  async deletePendingLeave(id: string, employeeId: string) {
    const leave = await this.leaveRepo.findById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.employeeId !== employeeId) {
      throw new ForbiddenError('You can only delete your own leave requests');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestError('Only pending leave requests can be deleted');
    }

    await this.leaveRepo.delete(id);

    await this.auditLogRepo.create({
      action: 'LEAVE_DELETE',
      details: `Deleted pending ${leave.leaveType} leave request from ${leave.startDate.toISOString().split('T')[0]}`,
      employeeId,
    });

    return { id };
  }

  async cancelLeave(id: string, employeeId: string) {
    const leave = await this.leaveRepo.findById(id);
    if (!leave) {
      throw new NotFoundError('Leave request not found');
    }

    if (leave.employeeId !== employeeId) {
      throw new ForbiddenError('You can only cancel your own leave requests');
    }

    if (leave.status === LeaveStatus.CANCELLED) {
      throw new BadRequestError('Leave request is already cancelled');
    }

    if (leave.status === LeaveStatus.REJECTED) {
      throw new BadRequestError('Rejected leave requests cannot be cancelled');
    }

    // Cancel pending or approved leaves
    const wasApproved = leave.status === LeaveStatus.APPROVED;

    const updatedLeave = await this.leaveRepo.update(id, {
      status: LeaveStatus.CANCELLED,
    });

    // Refund leaves if it was already approved and we cancel
    if (wasApproved && leave.leaveType !== LeaveType.UNPAID) {
      const employee = await this.employeeRepo.findById(employeeId);
      if (employee) {
        const refundedBalance = employee.leaveBalance + leave.totalDays;
        await this.employeeRepo.updateLeaveBalance(employeeId, refundedBalance);
      }
    }

    await this.auditLogRepo.create({
      action: 'LEAVE_CANCEL',
      details: `Cancelled ${wasApproved ? 'approved' : 'pending'} ${leave.leaveType} leave. Balance refunded: ${wasApproved && leave.leaveType !== LeaveType.UNPAID ? 'Yes' : 'No'}`,
      employeeId,
    });

    return updatedLeave;
  }

  // Utility method: calculates only weekdays (Mon-Fri)
  private calculateBusinessDays(startDate: Date, endDate: Date): number {
    let count = 0;
    const curDate = new Date(startDate.getTime());
    // Reset hour parts to avoid timezone mismatch count errors
    curDate.setHours(0, 0, 0, 0);
    const endCompare = new Date(endDate.getTime());
    endCompare.setHours(0, 0, 0, 0);

    while (curDate <= endCompare) {
      const dayOfWeek = curDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      curDate.setDate(curDate.getDate() + 1);
    }
    return count;
  }
}
