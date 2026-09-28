import { jest } from "@jest/globals";
import request from "supertest";
import { createApp } from "../app.js";
import { sequelize } from "../database/sequelize.js";

jest.mock("../services/auth.service.js", () => {
  class InitialRegistrationClosedError extends Error {}

  return {
    authenticateAdmin: jest.fn(
      async (email: string, password: string) =>
        email === "hr.admin@acme.com" && password === "ChangeMe123!",
    ),
    InitialRegistrationClosedError,
    registerInitialUser: jest.fn(),
    serializeUser: jest.fn(),
  };
});

const originalAllowInitialRegistration = process.env.ALLOW_INITIAL_REGISTRATION;

beforeAll(() => {
  process.env.HR_ADMIN_EMAIL = "hr.admin@acme.com";
  process.env.HR_ADMIN_PASSWORD = "ChangeMe123!";
  process.env.JWT_SECRET = "test-secret";
  delete process.env.ALLOW_INITIAL_REGISTRATION;
});

afterAll(async () => {
  if (originalAllowInitialRegistration === undefined) {
    delete process.env.ALLOW_INITIAL_REGISTRATION;
  } else {
    process.env.ALLOW_INITIAL_REGISTRATION = originalAllowInitialRegistration;
  }
  await sequelize.close();
});

describe("auth routes", () => {
  const app = createApp();

  it("rejects empty credentials", async () =>
    expect((await request(app).post("/api/auth/login").send({})).status).toBe(
      400,
    ));

  it("rejects oversized JSON bodies", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ password: "x".repeat(33 * 1024) });

    expect(response.status).toBe(413);
  });

  it("rejects wrong password", async () =>
    expect(
      (
        await request(app)
          .post("/api/auth/login")
          .send({ email: "hr.admin@acme.com", password: "wrong" })
      ).status,
    ).toBe(401));

  it("issues a token for valid credentials", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({ email: "hr.admin@acme.com", password: "ChangeMe123!" });
    expect(response.status).toBe(200);
    expect(response.body.token).toEqual(expect.any(String));
  });

  it("disables initial registration by default", async () => {
    const response = await request(app).post("/api/auth/register").send({
      email: "first.admin@example.com",
      password: "StrongPassword123!",
    });
    expect(response.status).toBe(403);
  });

  it("protects employees", async () =>
    expect((await request(app).get("/api/employees")).status).toBe(401));

  it("protects analytics", async () =>
    expect(
      (await request(app).get("/api/analytics/pay-by-group?groupBy=country"))
        .status,
    ).toBe(401));
});
