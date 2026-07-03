import prisma from '../config/prisma';
import { AuditLog, Prisma } from '@prisma/client';

export class AuditLogRepository {
  async create(data: { action: string; details: string; employeeId?: string }): Promise<AuditLog> {
    return prisma.auditLog.create({
      data,
    });
  }

  async findAll(params: {
    skip?: number;
    take?: number;
  }): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          employee: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, total };
  }

  async findByEmployeeId(
    employeeId: string,
    params: { skip?: number; take?: number }
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const where: Prisma.AuditLogWhereInput = { employeeId };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { logs, total };
  }
}
