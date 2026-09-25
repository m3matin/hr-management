import {
  Op,
  type IncludeOptions,
  type Order,
  type WhereOptions,
} from "sequelize";
import { EmployeeStatus, type SalaryReason } from "../enums.js";
import { NotFoundError, ValidationError } from "../errors.js";
import { Employee, SalaryHistory } from "../models/index.js";
import { sequelize } from "../database/sequelize.js";

export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 100;

export interface ListEmployeesInput {
  page: number;
  pageSize: number;
  search?: string;
  country?: string;
  department?: string;
  status?: EmployeeStatus;
}

export interface AppendSalaryInput {
  amountMinor: number;
  effectiveDate: string;
  reason: SalaryReason;
}

export function clampPageSize(value: number): number {
  return Number.isFinite(value) && value >= 1
    ? Math.min(Math.floor(value), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE;
}

const currentSalaryInclude: IncludeOptions = {
  model: SalaryHistory,
  as: "salaryHistory",
  separate: true,
  limit: 1,
  order: [
    ["effectiveDate", "DESC"],
    ["createdAt", "DESC"],
  ] as Order,
};

function buildEmployeeWhere(input: ListEmployeesInput): WhereOptions {
  const where: WhereOptions = {};

  if (input.country) {
    where.country = input.country;
  }
  if (input.department) {
    where.department = input.department;
  }
  if (input.status) {
    where.status = input.status;
  }
  if (input.search) {
    Object.assign(where, {
      [Op.or]: ["firstName", "lastName", "email", "employeeCode"].map(
        (attribute) => ({
          [attribute]: {
            [Op.iLike]: `%${input.search}%`,
          },
        }),
      ),
    });
  }

  return where;
}

function toDateOnly(value: string | Date): string {
  return value instanceof Date
    ? value.toISOString().slice(0, 10)
    : value.slice(0, 10);
}

function serializeSalary(row: SalaryHistory) {
  return {
    id: row.id,
    employeeId: row.employeeId,
    amountMinor: BigInt(row.amountMinor).toString(),
    currency: row.currency,
    effectiveDate: toDateOnly(row.effectiveDate),
    reason: row.reason,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function serializeEmployee(row: Employee) {
  const currentSalary = row.salaryHistory?.[0];

  return {
    id: row.id,
    employeeCode: row.employeeCode,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    country: row.country,
    department: row.department,
    roleTitle: row.roleTitle,
    gender: row.gender,
    hireDate: toDateOnly(row.hireDate),
    status: row.status,
    currency: row.currency,
    currentSalaryMinor: currentSalary
      ? BigInt(currentSalary.amountMinor).toString()
      : null,
    currentSalaryCurrency: currentSalary?.currency ?? row.currency,
  };
}

export async function listEmployees(input: ListEmployeesInput) {
  const pageSize = clampPageSize(input.pageSize);
  const page =
    Number.isSafeInteger(input.page) && input.page > 0 ? input.page : 1;
  const where = buildEmployeeWhere(input);

  const { count, rows } = await sequelize.transaction(async (transaction) => {
    const [total, employees] = await Promise.all([
      Employee.count({ where, transaction }),
      Employee.findAll({
        where,
        include: [currentSalaryInclude],
        order: [
          ["lastName", "ASC"],
          ["firstName", "ASC"],
          ["id", "ASC"],
        ],
        offset: (page - 1) * pageSize,
        limit: pageSize,
        transaction,
      }),
    ]);

    return { count: total, rows: employees };
  });

  return {
    page,
    pageSize,
    total: Number(count),
    totalPages: Math.ceil(Number(count) / pageSize),
    items: rows.map(serializeEmployee),
  };
}

export async function getEmployee(id: string) {
  const employeeId = Number(id);
  const employee = Number.isSafeInteger(employeeId)
    ? await Employee.findByPk(employeeId, {
        include: [
          {
            model: SalaryHistory,
            as: "salaryHistory",
            order: currentSalaryInclude.order,
          },
        ],
      })
    : null;

  if (!employee) {
    throw new NotFoundError("Employee not found");
  }

  const salaryHistory = (employee.salaryHistory ?? []).map(serializeSalary);

  return {
    ...serializeEmployee(employee),
    salaryHistory,
    currentSalaryMinor: salaryHistory[0]?.amountMinor ?? null,
  };
}

export async function appendSalary(id: string, input: AppendSalaryInput) {
  if (!Number.isSafeInteger(input.amountMinor) || input.amountMinor <= 0) {
    throw new ValidationError("amountMinor must be a positive integer");
  }

  const employeeId = Number(id);
  const employee = Number.isSafeInteger(employeeId)
    ? await Employee.findByPk(employeeId, {
        attributes: ["id", "currency"],
      })
    : null;

  if (!employee) {
    throw new NotFoundError("Employee not found");
  }

  const salary = await SalaryHistory.create({
    employeeId,
    amountMinor: BigInt(input.amountMinor),
    currency: employee.currency,
    effectiveDate: toDateOnly(input.effectiveDate),
    reason: input.reason,
  });

  return serializeSalary(salary);
}
