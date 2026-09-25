import "express-async-errors";
import cors from "cors";
import express from "express";
import authRoutes from "./routes/auth.routes.js";
import employeeRoutes from "./routes/employees.routes.js";
import analyticsRoutes from "./routes/analytics.routes.js";
import { requireAuth } from "./middleware/auth.js";
import { errorHandler, notFound } from "./middleware/error.js";

export function createApp() {
  const app = express();
  app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
  app.use(express.json({ limit: "32kb" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/auth", authRoutes);
  app.use("/api/employees", requireAuth, employeeRoutes);
  app.use("/api/analytics", requireAuth, analyticsRoutes);
  app.use(notFound);
  app.use(errorHandler);
  return app;
}
