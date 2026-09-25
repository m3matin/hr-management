import { Request, Response } from "express";
import Joi from "joi";
import jwt from "jsonwebtoken";
import { getJwtExpiresIn, getJwtSecret } from "../config/auth.js";
import {
  authenticateAdmin,
  InitialRegistrationClosedError,
  registerInitialUser,
  serializeUser,
} from "../services/auth.service.js";

const loginSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(320).required(),
  password: Joi.string().required(),
});

const registrationSchema = Joi.object({
  email: Joi.string().trim().lowercase().email().max(320).required(),
  password: Joi.string().min(8).max(128).required(),
});

function validationError(res: Response, error: Joi.ValidationError): void {
  res
    .status(400)
    .json({ error: error.details.map((detail) => detail.message) });
}

export async function login(req: Request, res: Response) {
  const { error, value } = loginSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    validationError(res, error);
    return;
  }

  if (!(await authenticateAdmin(value.email, value.password))) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  res.json({
    token: jwt.sign({ email: value.email }, getJwtSecret(), {
      expiresIn: getJwtExpiresIn(),
      algorithm: "HS256",
    }),
  });
}

export async function registerInitial(req: Request, res: Response) {
  if (process.env.ALLOW_INITIAL_REGISTRATION !== "true") {
    res.status(403).json({ error: "Initial HR registration is disabled." });
    return;
  }

  const { error, value } = registrationSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error) {
    validationError(res, error);
    return;
  }

  try {
    const user = await registerInitialUser(value.email, value.password);
    res.status(201).json({ user: serializeUser(user) });
  } catch (caught: unknown) {
    if (caught instanceof InitialRegistrationClosedError) {
      res.status(409).json({ error: caught.message });
      return;
    }
    throw caught;
  }
}
