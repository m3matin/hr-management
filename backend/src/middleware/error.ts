import { ErrorRequestHandler, RequestHandler } from 'express';
import { NotFoundError, ValidationError } from '../errors.js';
export const notFound: RequestHandler = (_req, res) => res.status(404).json({ error: 'Route not found' });
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ValidationError || error instanceof NotFoundError) return res.status(error.statusCode).json({ error: error.message });
  console.error(error); return res.status(500).json({ error: 'Internal server error' });
};
