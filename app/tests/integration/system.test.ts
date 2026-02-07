import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";

describe("System routes", () => {
  let app: Hono;

  beforeAll(() => {
    const testEnv = createTestApp();
    app = testEnv.app;
  });

  describe("GET /api/v2/hello", () => {
    test("returns greeting message", async () => {
      const res = await testRequest(app, "/api/v2/hello");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.message).toBe("Focalboard API");
    });
  });

  describe("GET /api/v2/ping", () => {
    test("returns status ok with server metadata", async () => {
      const res = await testRequest(app, "/api/v2/ping");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.status).toBe("ok");
      expect(body.serverTime).toBeNumber();
      expect(body.serverVersion).toBe("0.1.0");
    });
  });

  describe("GET /api/v2/clientConfig", () => {
    test("returns client configuration", async () => {
      const res = await testRequest(app, "/api/v2/clientConfig");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(typeof body.telemetry).toBe("boolean");
      expect(typeof body.enablePublicSharedBoards).toBe("boolean");
    });
  });

  describe("CSRF middleware", () => {
    test("blocks requests without X-Requested-With header", async () => {
      const res = await app.request("/api/v2/ping", {
        headers: {},
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toContain("checkCSRFToken FAILED");
      expect(body.errorCode).toBe(400);
    });

    test("allows requests with correct X-Requested-With header", async () => {
      const res = await testRequest(app, "/api/v2/ping");
      expect(res.status).toBe(200);
    });

    test("blocks requests with wrong X-Requested-With value", async () => {
      const res = await app.request("/api/v2/ping", {
        headers: { "X-Requested-With": "wrong-value" },
      });
      expect(res.status).toBe(400);
    });
  });

  describe("Error handling middleware", () => {
    test("returns JSON error format for 404", async () => {
      const res = await testRequest(app, "/api/v2/nonexistent");
      expect(res.status).toBe(404);
    });

    test("error response has correct shape", async () => {
      const res = await app.request("/api/v2/ping", { headers: {} });
      const body = await res.json();
      expect(body).toHaveProperty("error");
      expect(body).toHaveProperty("errorCode");
      expect(typeof body.error).toBe("string");
      expect(typeof body.errorCode).toBe("number");
    });
  });
});
