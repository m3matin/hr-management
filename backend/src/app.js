import cors from 'cors';
import express from 'express';
import dashboardRoutes from './routes/dashboard.routes.js';
import employeeRoutes from './routes/employee.routes.js';
import { errorHandler, notFound } from './middleware/error.middleware.js';

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
  app.use(express.json());
  app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: process.env.DATABASE_URL ? 'configured' : 'not-configured' }));
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/employees', employeeRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
