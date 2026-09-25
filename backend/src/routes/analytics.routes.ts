import { Router } from "express";
import * as controller from "../controllers/analytics.controller.js";
const router = Router();
router.get("/pay-by-group", controller.payByGroup);
router.get("/payroll-trend", controller.payrollTrend);
export default router;
