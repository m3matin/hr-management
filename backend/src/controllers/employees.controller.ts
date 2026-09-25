import Joi from 'joi'; import { Request, Response, NextFunction } from 'express'; import * as service from '../services/employees.service.js';
const listSchema = Joi.object({ page: Joi.number().integer().min(1).default(1), pageSize: Joi.number().integer().min(1).default(25), search: Joi.string().trim().min(1).optional(), country: Joi.string().length(2).uppercase().optional(), department: Joi.string().trim().optional(), status: Joi.string().valid('ACTIVE', 'TERMINATED').optional() });
const idSchema = Joi.object({ id: Joi.number().integer().positive().required() }); const salarySchema = Joi.object({ amountMinor: Joi.number().integer().positive().required(), effectiveDate: Joi.date().iso().required(), reason: Joi.string().valid('INITIAL', 'RAISE', 'ADJUSTMENT', 'PROMOTION').required() });
function validate(schema: Joi.ObjectSchema, input: unknown, res: Response) { const { error, value } = schema.validate(input, { abortEarly: false, convert: true }); if (error) { res.status(400).json({ error: error.details.map((d) => d.message) }); return null; } return value; }
export async function list(req: Request, res: Response) { const value = validate(listSchema, req.query, res); if (value) res.json(await service.listEmployees(value)); }
export async function detail(req: Request, res: Response) { if (validate(idSchema, req.params, res)) res.json(await service.getEmployee(String(req.params.id))); }
export async function updateSalary(req: Request, res: Response) { if (!validate(idSchema, req.params, res)) return; const value = validate(salarySchema, req.body, res); if (value) res.status(201).json(await service.appendSalary(String(req.params.id), value)); }


