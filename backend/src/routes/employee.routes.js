import { Router } from 'express';
import * as controller from '../controllers/employee.controller.js';
const router = Router();
router.get('/', controller.list);
router.get('/:id', controller.detail);
router.get('/:id/salary-history', controller.history);
router.post('/:id/salary-revisions', controller.reviseSalary);
export default router;
