import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Statistics routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;

    db.insert(teams).values({ id: "team-1", title: "Test Team" }).run();

    const regRes = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "statuser@example.com",
        username: "statuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    // Create boards and cards for stats
    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Stats Board", type: "O" }),
    });
    const boardBody = await boardRes.json();

    await authRequest(`/api/v2/boards/${boardBody.id}/cards`, {
      method: "POST",
      body: JSON.stringify({ title: "Card 1" }),
    });
    await authRequest(`/api/v2/boards/${boardBody.id}/cards`, {
      method: "POST",
      body: JSON.stringify({ title: "Card 2" }),
    });
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

  describe("GET /api/v2/statistics", () => {
    test("returns board and card counts", async () => {
      const res = await authRequest("/api/v2/statistics");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.board_count).toBeGreaterThanOrEqual(1);
      expect(body.card_count).toBeGreaterThanOrEqual(2);
    });
  });
});
