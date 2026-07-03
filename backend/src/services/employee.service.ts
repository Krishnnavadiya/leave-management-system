import { EmployeeRepository } from '../repositories/employee.repository';
import { NotFoundError } from '../utils/errors';
import { Role } from '../config/enums';

export class EmployeeService {
  private employeeRepo = new EmployeeRepository();

  async getProfile(id: string) {
    const employee = await this.employeeRepo.findById(id);
    if (!employee) {
      throw new NotFoundError('Employee not found');
    }

    // Omit sensitive password
    const { password, ...profile } = employee;
    return profile;
  }

  async getEmployees(params: {
    search?: string;
    department?: string;
    role?: Role;
    page?: number;
    limit?: number;
  }) {
    const limit = params.limit || 10;
    const page = params.page || 1;
    const skip = (page - 1) * limit;

    const { employees, total } = await this.employeeRepo.findAll({
      search: params.search,
      department: params.department,
      role: params.role,
      skip,
      take: limit,
    });

    // Remove password from lists
    const sanitizedEmployees = employees.map(({ password, ...emp }) => emp);

    return {
      employees: sanitizedEmployees,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
