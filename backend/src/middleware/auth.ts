import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getJwtSecret } from "../config/auth.js";

export interface AuthRequest extends Request {
  user?: { email: string };
}

export function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) {
  const authorization = req.header("authorization");
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return res.status(401).json({ error: "Authentication required" });
  }

  try {
    const payload = jwt.verify(match[1], getJwtSecret(), {
      algorithms: ["HS256"],
    });
    if (typeof payload === "string" || typeof payload.email !== "string") {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = { email: payload.email };
    return next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
