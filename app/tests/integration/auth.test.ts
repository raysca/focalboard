import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";

describe("Auth routes", () => {
  let app: Hono;

  beforeAll(() => {
    const testEnv = createTestApp();
    app = testEnv.app;
  });

  describe("POST /api/v2/register", () => {
    test("registers a new user successfully", async () => {
      const res = await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "testuser@example.com",
          username: "testuser",
          password: "password123",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.token).toBeDefined();
      expect(body.user.id).toBeDefined();
      expect(body.user.username).toBe("testuser");
      expect(body.user.email).toBe("testuser@example.com");
    });

    test("rejects registration without email", async () => {
      const res = await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: "password123",
        }),
      });
      expect(res.status).toBe(400);
    });

    test("rejects registration without password", async () => {
      const res = await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "test2@example.com",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v2/login", () => {
    test("logs in with valid credentials", async () => {
      // First register
      await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "loginuser@example.com",
          username: "loginuser",
          password: "password123",
        }),
      });

      // Then login
      const res = await testRequest(app, "/api/v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "loginuser@example.com",
          password: "password123",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.token).toBeDefined();
      expect(body.user.id).toBeDefined();
    });

    test("rejects login with invalid password", async () => {
      const res = await testRequest(app, "/api/v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "loginuser@example.com",
          password: "wrongpassword",
        }),
      });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    test("rejects login without password", async () => {
      const res = await testRequest(app, "/api/v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "loginuser@example.com",
        }),
      });
      expect(res.status).toBe(400);
    });

    test("rejects login without email", async () => {
      const res = await testRequest(app, "/api/v2/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password: "password123",
        }),
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v2/users/:userID/changepassword", () => {
    test("rejects without authentication", async () => {
      const res = await testRequest(app, "/api/v2/users/someid/changepassword", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oldPassword: "password123",
          newPassword: "newpassword123",
        }),
      });
      expect(res.status).toBe(401);
    });
  });
});
