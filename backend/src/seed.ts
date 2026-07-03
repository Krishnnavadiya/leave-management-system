import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding (SQLite mode)...');

  // Clean old data
  await prisma.auditLog.deleteMany({});
  await prisma.refreshToken.deleteMany({});
  await prisma.leave.deleteMany({});
  await prisma.employee.deleteMany({});

  const hashedPassword = await bcrypt.hash('Password123', 10);

  // 1. Create Manager
  const manager = await prisma.employee.create({
    data: {
      name: 'Jane Doe',
      email: 'manager@example.com',
      password: hashedPassword,
      department: 'Human Resources',
      role: 'MANAGER',
      leaveBalance: 30,
    },
  });
  console.log(`Created manager: ${manager.name} (${manager.email})`);

  // 2. Create 5 Employees
  const employeesData = [
    { name: 'John Smith', email: 'employee1@example.com', department: 'Engineering' },
    { name: 'Alice Johnson', email: 'employee2@example.com', department: 'Engineering' },
    { name: 'Bob Lee', email: 'employee3@example.com', department: 'Marketing' },
    { name: 'Charlie Brown', email: 'employee4@example.com', department: 'Design' },
    { name: 'David Miller', email: 'employee5@example.com', department: 'Sales' },
  ];

  const employees = [];
  for (const emp of employeesData) {
    const employee = await prisma.employee.create({
      data: {
        name: emp.name,
        email: emp.email,
        password: hashedPassword,
        department: emp.department,
        role: 'EMPLOYEE',
        leaveBalance: 30,
      },
    });
    employees.push(employee);
    console.log(`Created employee: ${employee.name} (${employee.email})`);
  }

  // 3. Create Sample Leave Records
  const today = new Date();

  // Employee 1: Approved annual leave last month
  const startDate1 = new Date(today);
  startDate1.setDate(today.getDate() - 20);
  const endDate1 = new Date(today);
  endDate1.setDate(today.getDate() - 15);
  await prisma.leave.create({
    data: {
      employeeId: employees[0].id,
      leaveType: 'ANNUAL',
      startDate: startDate1,
      endDate: endDate1,
      totalDays: 6,
      reason: 'Family trip',
      status: 'APPROVED',
      managerComment: 'Approved, enjoy your vacation!',
    },
  });

  // Employee 1: Pending sick leave request
  const startDate2 = new Date(today);
  startDate2.setDate(today.getDate() + 2);
  const endDate2 = new Date(today);
  endDate2.setDate(today.getDate() + 3);
  await prisma.leave.create({
    data: {
      employeeId: employees[0].id,
      leaveType: 'SICK',
      startDate: startDate2,
      endDate: endDate2,
      totalDays: 2,
      reason: 'Dental surgery',
      status: 'PENDING',
    },
  });

  // Employee 2: Rejected casual leave request
  const startDate3 = new Date(today);
  startDate3.setDate(today.getDate() - 10);
  const endDate3 = new Date(today);
  endDate3.setDate(today.getDate() - 9);
  await prisma.leave.create({
    data: {
      employeeId: employees[1].id,
      leaveType: 'CASUAL',
      startDate: startDate3,
      endDate: endDate3,
      totalDays: 2,
      reason: 'Personal errands',
      status: 'REJECTED',
      managerComment: 'High workload, project delivery pending.',
    },
  });

  // Employee 3: Pending annual leave request
  const startDate4 = new Date(today);
  startDate4.setDate(today.getDate() + 10);
  const endDate4 = new Date(today);
  endDate4.setDate(today.getDate() + 15);
  await prisma.leave.create({
    data: {
      employeeId: employees[2].id,
      leaveType: 'ANNUAL',
      startDate: startDate4,
      endDate: endDate4,
      totalDays: 6,
      reason: 'Summer vacation plans',
      status: 'PENDING',
    },
  });

  // Employee 4: Cancelled leave request
  const startDate5 = new Date(today);
  startDate5.setDate(today.getDate() - 30);
  const endDate5 = new Date(today);
  endDate5.setDate(today.getDate() - 28);
  await prisma.leave.create({
    data: {
      employeeId: employees[3].id,
      leaveType: 'UNPAID',
      startDate: startDate5,
      endDate: endDate5,
      totalDays: 3,
      reason: 'Personal urgencies',
      status: 'CANCELLED',
    },
  });

  // Deduct approved leave days from Employee 1 balance
  await prisma.employee.update({
    where: { id: employees[0].id },
    data: { leaveBalance: 24 }, // 30 - 6
  });

  // Add initial Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { action: 'SEEDING', details: 'Database seeded with sample users and records' },
      { action: 'USER_CREATION', details: `Manager Jane Doe created`, employeeId: manager.id },
      ...employees.map(emp => ({
        action: 'USER_CREATION',
        details: `Employee ${emp.name} created`,
        employeeId: emp.id,
      })),
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
