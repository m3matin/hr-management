import { demoEmployees } from '../data/demoEmployees.js';

const employees = structuredClone(demoEmployees);
export const employeeModel = {
  list({ search = '', department = '', country = '', page = 1, pageSize = 10 }) {
    const term = search.toLowerCase();
    const matches = employees.filter((employee) => {
      const haystack = `${employee.firstName} ${employee.lastName} ${employee.email} ${employee.employeeNumber}`.toLowerCase();
      return (!term || haystack.includes(term)) && (!department || employee.department === department) && (!country || employee.country === country);
    });
    const start = (page - 1) * pageSize;
    return { data: matches.slice(start, start + pageSize), total: matches.length };
  },
  findById: (id) => employees.find((employee) => employee.id === id),
  reviseSalary(id, revision) {
    const employee = employees.find((item) => item.id === id);
    if (!employee) return null;
    employee.salaryMinor = revision.salaryMinor;
    employee.currency = revision.currency;
    employee.effectiveDate = revision.effectiveDate;
    employee.history.unshift(revision);
    return employee;
  },
  filters() { return { departments: [...new Set(employees.map((x) => x.department))], countries: [...new Set(employees.map((x) => x.country))] }; },
  all: () => employees
};
