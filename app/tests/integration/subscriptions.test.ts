import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";

describe("Subscription routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;
  let subscriberId: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;

    const regRes = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "subuser@example.com",
        username: "subuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    const meRes = await authRequest("/api/v2/users/me");
    const meBody = await meRes.json();
    subscriberId = meBody.id;
  });

  function authRequest(path: string, options: RequestInit = {}) {
    const headers = new Headers(options.headers);
    headers.set("X-Requested-With", "XMLHttpRequest");
    headers.set("Authorization", `Bearer ${authToken}`);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }
    return app.request(path, { ...options, headers });
  }

  const blockId = "test-block-id";

  describe("POST /api/v2/subscriptions", () => {
    test("creates a subscription", async () => {
      const res = await authRequest("/api/v2/subscriptions", {
        method: "POST",
        body: JSON.stringify({
          blockType: "card",
          blockId,
          subscriberType: "user",
          subscriberId,
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.blockId).toBe(blockId);
      expect(body.subscriberId).toBe(subscriberId);
    });
  });

  describe("GET /api/v2/subscriptions/:subscriberID", () => {
    test("gets subscriptions for user", async () => {
      const res = await authRequest(`/api/v2/subscriptions/${subscriberId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].subscriberId).toBe(subscriberId);
    });
  });

  describe("DELETE /api/v2/subscriptions/:blockID/:subscriberID", () => {
    test("deletes a subscription", async () => {
      const res = await authRequest(`/api/v2/subscriptions/${blockId}/${subscriberId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      // Verify deleted (soft delete means deleteAt > 0, so not returned)
      const listRes = await authRequest(`/api/v2/subscriptions/${subscriberId}`);
      const listBody = await listRes.json();
      expect(listBody.length).toBe(0);
    });
  });
});
