import { employeeModel } from '../models/employee.model.js';

export function getDashboard() {
  const employees = employeeModel.all();
  const byDepartment = Object.values(employees.reduce((result, employee) => {
    const key = `${employee.department}:${employee.currency}`;
    const group = result[key] ||= { department: employee.department, headcount: 0, totalSalaryMinor: 0, currency: employee.currency };
    group.headcount += 1;
    group.totalSalaryMinor += employee.salaryMinor;
    return result;
  }, {})).map((group) => ({ ...group, averageSalaryMinor: Math.round(group.totalSalaryMinor / group.headcount) }));
  const payrollTotals = employees.reduce((result, employee) => {
    result[employee.currency] = (result[employee.currency] || 0) + employee.salaryMinor;
    return result;
  }, {});
  const payrollByCurrency = Object.entries(payrollTotals).map(([currency, totalSalaryMinor]) => ({ currency, totalSalaryMinor }));
  return { headcount: employees.length, departments: byDepartment, payrollByCurrency, filters: employeeModel.filters() };
}
