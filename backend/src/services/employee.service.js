import { employeeModel } from '../models/employee.model.js';

export function listEmployees(query) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10));
  const { data, total } = employeeModel.list({ ...query, page, pageSize });
  return { data, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } };
}
export function getEmployee(id) { return employeeModel.findById(id); }
export function getEmployeeHistory(id) { return employeeModel.findById(id)?.history ?? null; }
export function createSalaryRevision(id, body) {
  const salaryMinor = Number(body.salaryMinor);
  if (!Number.isInteger(salaryMinor) || salaryMinor <= 0) throw Object.assign(new Error('salaryMinor must be a positive integer.'), { status: 400 });
  if (!/^[A-Z]{3}$/.test(body.currency || '')) throw Object.assign(new Error('currency must be a three-letter ISO code.'), { status: 400 });
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.effectiveDate || '')) throw Object.assign(new Error('effectiveDate must use YYYY-MM-DD.'), { status: 400 });
  return employeeModel.reviseSalary(id, { salaryMinor, currency: body.currency, effectiveDate: body.effectiveDate, reason: body.reason?.trim() || 'Salary revision' });
}
