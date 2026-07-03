import prisma from '../config/prisma';
import { Leave, Prisma } from '@prisma/client';
import { LeaveStatus, LeaveType } from '../config/enums';

export interface LeaveQueryParams {
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  skip?: number;
  take?: number;
}

export class LeaveRepository {
  async create(data: Prisma.LeaveUncheckedCreateInput): Promise<Leave> {
    return prisma.leave.create({
      data,
    });
  }

  async findById(id: string): Promise<Leave | null> {
    return prisma.leave.findUnique({
      where: { id },
    });
  }

  async findWithEmployeeById(id: string) {
    return prisma.leave.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            role: true,
            leaveBalance: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.LeaveUpdateInput): Promise<Leave> {
    return prisma.leave.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Leave> {
    return prisma.leave.delete({
      where: { id },
    });
  }

  async findAll(params: LeaveQueryParams) {
    const where: Prisma.LeaveWhereInput = {};

    if (params.employeeId) {
      where.employeeId = params.employeeId;
    }

    if (params.status) {
      where.status = params.status;
    }

    if (params.leaveType) {
      where.leaveType = params.leaveType;
    }

    if (params.startDate || params.endDate) {
      where.startDate = {};
      if (params.startDate) {
        where.startDate.gte = params.startDate;
      }
      if (params.endDate) {
        where.startDate.lte = params.endDate;
      }
    }

    if (params.search) {
      where.employee = {
        name: { contains: params.search, mode: 'insensitive' },
      };
    }

    const [leaves, total] = await Promise.all([
      prisma.leave.findMany({
        where,
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              department: true,
              role: true,
              leaveBalance: true,
            },
          },
        },
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.leave.count({ where }),
    ]);

    return { leaves, total };
  }
}
