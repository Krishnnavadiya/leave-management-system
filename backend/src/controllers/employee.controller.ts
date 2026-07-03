import { Request, Response, NextFunction } from 'express';
import { EmployeeService } from '../services/employee.service';
import { Role } from '../config/enums';
import { ForbiddenError } from '../utils/errors';

export class EmployeeController {
  private employeeService = new EmployeeService();

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = req.user!.id;
      const profile = await this.employeeService.getProfile(id);

      return res.status(200).json({
        success: true,
        message: 'Profile retrieved successfully',
        data: profile,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  getEmployeeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Allow users to see their own profile, or manager to see any profile
      if (req.user!.role !== Role.MANAGER && req.user!.id !== id) {
        throw new ForbiddenError('You do not have permission to view this employee details');
      }

      const profile = await this.employeeService.getProfile(id);

      return res.status(200).json({
        success: true,
        message: 'Employee details retrieved successfully',
        data: profile,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };

  getEmployees = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { search, department, role, page, limit } = req.query;

      const result = await this.employeeService.getEmployees({
        search: search as string,
        department: department as string,
        role: role as Role,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
      });

      return res.status(200).json({
        success: true,
        message: 'Employees list retrieved successfully',
        data: result,
        errors: null,
      });
    } catch (error) {
      return next(error);
    }
  };
}
