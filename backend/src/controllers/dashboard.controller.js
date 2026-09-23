import { getDashboard } from '../services/dashboard.service.js';
export const overview = (_req, res) => res.json(getDashboard());
