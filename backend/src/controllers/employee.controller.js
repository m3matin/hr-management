import * as employeeService from '../services/employee.service.js';
const notFound = (res) => res.status(404).json({ message: 'Employee not found.' });
export const list = (req, res) => res.json(employeeService.listEmployees(req.query));
export const detail = (req, res) => { const employee = employeeService.getEmployee(req.params.id); return employee ? res.json(employee) : notFound(res); };
export const history = (req, res) => { const data = employeeService.getEmployeeHistory(req.params.id); return data ? res.json({ data }) : notFound(res); };
export const reviseSalary = (req, res, next) => { try { const employee = employeeService.createSalaryRevision(req.params.id, req.body); return employee ? res.status(201).json(employee) : notFound(res); } catch (error) { return next(error); } };
export const filters = (_req, res) => res.json(employeeService.listEmployees({ pageSize: 1 }).pagination && (awaitless()));
function awaitless() { return { message: 'Use /api/dashboard for filter options.' }; }
