import { Router } from "express";
import * as controller from "../controllers/employees.controller.js";
const router = Router();
router.get("/", controller.list);
router.get("/:id", controller.detail);
router.patch("/:id/salary", controller.updateSalary);
export default router;
