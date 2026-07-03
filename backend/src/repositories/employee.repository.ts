import prisma from '../config/prisma';
import { Employee, Prisma } from '@prisma/client';
import { Role } from '../config/enums';

export class EmployeeRepository {
  async findById(id: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<Employee | null> {
    return prisma.employee.findUnique({
      where: { email },
    });
  }

  async findAll(params: {
    search?: string;
    department?: string;
    role?: Role;
    skip?: number;
    take?: number;
  }): Promise<{ employees: Employee[]; total: number }> {
    const where: Prisma.EmployeeWhereInput = {};

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { email: { contains: params.search, mode: 'insensitive' } },
      ];
    }

    if (params.department) {
      where.department = params.department;
    }

    if (params.role) {
      where.role = params.role;
    }

    const [employees, total] = await Promise.all([
      prisma.employee.findMany({
        where,
        skip: params.skip,
        take: params.take,
        orderBy: { name: 'asc' },
      }),
      prisma.employee.count({ where }),
    ]);

    return { employees, total };
  }

  async update(id: string, data: Prisma.EmployeeUpdateInput): Promise<Employee> {
    return prisma.employee.update({
      where: { id },
      data,
    });
  }

  async updateLeaveBalance(id: string, newBalance: number): Promise<Employee> {
    return prisma.employee.update({
      where: { id },
      data: { leaveBalance: newBalance },
    });
  }
}
