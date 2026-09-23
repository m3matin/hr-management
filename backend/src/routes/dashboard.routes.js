import { Router } from 'express';
import { overview } from '../controllers/dashboard.controller.js';
const router = Router();
router.get('/', overview);
export default router;
