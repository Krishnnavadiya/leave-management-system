import { EmployeeRepository } from '../repositories/employee.repository';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import prisma from '../config/prisma';
import { UnauthorizedError } from '../utils/errors';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Role } from '../config/enums';

export class AuthService {
  private employeeRepo = new EmployeeRepository();
  private auditLogRepo = new AuditLogRepository();

  async login(
    email: string,
    pass: string
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    employee: { id: string; name: string; email: string; role: Role; department: string; leaveBalance: number };
  }> {
    const employee = await this.employeeRepo.findByEmail(email);
    if (!employee) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, employee.password);
    if (!isMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(employee);
    const refreshToken = await this.generateRefreshToken(employee.id);

    // Write Audit Log
    await this.auditLogRepo.create({
      action: 'LOGIN',
      details: 'User logged in successfully',
      employeeId: employee.id,
    });

    return {
      accessToken,
      refreshToken,
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role as Role,
        department: employee.department,
        leaveBalance: employee.leaveBalance,
      },
    };
  }

  async logout(token: string): Promise<void> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
    });

    if (!storedToken) {
      return;
    }

    // Delete token and audit log
    await prisma.refreshToken.delete({
      where: { token },
    });

    await this.auditLogRepo.create({
      action: 'LOGOUT',
      details: 'User logged out',
      employeeId: storedToken.employeeId,
    });
  }

  async refresh(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token },
      include: { employee: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      if (storedToken) {
        await prisma.refreshToken.delete({ where: { token } });
      }
      throw new UnauthorizedError('Refresh token expired or invalid');
    }

    // Delete old refresh token (Token Rotation for security)
    await prisma.refreshToken.delete({ where: { token } });

    // Generate new set of tokens
    const accessToken = this.generateAccessToken(storedToken.employee);
    const newRefreshToken = await this.generateRefreshToken(storedToken.employeeId);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  private generateAccessToken(employee: any): string {
    const secret = process.env.JWT_ACCESS_SECRET || 'fallback_access_secret';
    const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';

    return jwt.sign(
      {
        id: employee.id,
        email: employee.email,
        role: employee.role,
        name: employee.name,
      },
      secret,
      { expiresIn: expiry as any }
    );
  }

  private async generateRefreshToken(employeeId: string): Promise<string> {
    const secret = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_secret';
    const expiryStr = process.env.JWT_REFRESH_EXPIRY || '7d';

    // Standard expiry calculation (default 7 days)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const token = jwt.sign({ id: employeeId }, secret, { expiresIn: expiryStr as any });

    await prisma.refreshToken.create({
      data: {
        token,
        employeeId,
        expiresAt,
      },
    });

    return token;
  }
}
