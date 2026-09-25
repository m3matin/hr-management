import "dotenv/config";
import jwt from "jsonwebtoken";
import {
  getAdminEmail,
  getJwtExpiresIn,
  getJwtSecret,
} from "../src/config/auth.js";

const token = jwt.sign({ email: getAdminEmail() }, getJwtSecret(), {
  expiresIn: getJwtExpiresIn(),
  algorithm: "HS256",
});

process.stdout.write(`${token}\n`);
