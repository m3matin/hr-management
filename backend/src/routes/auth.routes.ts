import { Router } from "express";
import { login, registerInitial } from "../controllers/auth.controller.js";

const router = Router();
router.post("/login", login);
router.post("/register", registerInitial);

export default router;
