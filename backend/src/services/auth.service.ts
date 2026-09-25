import bcrypt from "bcryptjs";
import type { Transaction } from "sequelize";
import { getAdminEmail, getAdminPassword } from "../config/auth.js";
import { sequelize } from "../database/sequelize.js";
import { User } from "../models/index.js";

export class InitialRegistrationClosedError extends Error {
  constructor() {
    super("Initial HR registration has already been completed.");
    this.name = "InitialRegistrationClosedError";
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isMissingUsersTable(error: unknown): boolean {
  const candidate = error as {
    original?: { code?: string };
    parent?: { code?: string };
    message?: string;
  };
  return (
    candidate.original?.code === "42P01" ||
    candidate.parent?.code === "42P01" ||
    candidate.message?.includes('relation "users" does not exist') === true
  );
}

async function countUsers(transaction?: Transaction): Promise<number> {
  try {
    return await User.count({ transaction });
  } catch (error: unknown) {
    if (isMissingUsersTable(error)) {
      return 0;
    }
    throw error;
  }
}

async function findUser(email: string): Promise<User | null> {
  try {
    return await User.findOne({ where: { email } });
  } catch (error: unknown) {
    if (isMissingUsersTable(error)) {
      return null;
    }
    throw error;
  }
}

export async function authenticateAdmin(
  email: string,
  password: string,
): Promise<boolean> {
  const normalizedEmail = normalizeEmail(email);
  const user = await findUser(normalizedEmail);

  if (user) {
    return bcrypt.compare(password, user.passwordHash);
  }

  // Keep the environment administrator usable until the first database user
  // is bootstrapped. Once a row exists, only database credentials are valid.
  if ((await countUsers()) > 0) {
    return false;
  }

  const environmentEmail = normalizeEmail(getAdminEmail());
  if (normalizedEmail !== environmentEmail) {
    return false;
  }

  return bcrypt.compare(password, await bcrypt.hash(getAdminPassword(), 10));
}

export async function registerInitialUser(
  email: string,
  password: string,
): Promise<User> {
  if (process.env.ALLOW_INITIAL_REGISTRATION !== "true") {
    throw new Error("Initial HR registration is disabled.");
  }

  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await bcrypt.hash(password, 12);

  return sequelize.transaction(async (transaction) => {
    // The lock makes the empty-table check atomic across concurrent requests.
    await sequelize.query("LOCK TABLE users IN EXCLUSIVE MODE", {
      transaction,
    });
    if ((await countUsers(transaction)) > 0) {
      throw new InitialRegistrationClosedError();
    }

    return User.create(
      {
        email: normalizedEmail,
        passwordHash,
        role: "HR_ADMIN",
      },
      { transaction },
    );
  });
}

export function serializeUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
  };
}
