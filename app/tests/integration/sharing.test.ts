import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Sharing routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;
  let boardId: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;

    db.insert(teams).values({ id: "team-1", title: "Test Team" }).run();

    const regRes = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "shareuser@example.com",
        username: "shareuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Share Test Board", type: "O" }),
    });
    const boardBody = await boardRes.json();
    boardId = boardBody.id;
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

  describe("GET /api/v2/boards/:boardID/sharing", () => {
    test("returns default sharing info (disabled)", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/sharing`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(boardId);
      expect(body.enabled).toBe(false);
    });
  });

  describe("POST /api/v2/boards/:boardID/sharing", () => {
    test("enables sharing", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/sharing`, {
        method: "POST",
        body: JSON.stringify({ enabled: true }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(true);
      expect(body.token).toBeDefined();
      expect(body.token.length).toBeGreaterThan(0);
    });

    test("disables sharing", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/sharing`, {
        method: "POST",
        body: JSON.stringify({ enabled: false }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.enabled).toBe(false);
    });
  });
});
