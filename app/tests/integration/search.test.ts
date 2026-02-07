import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Search routes", () => {
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
        email: "searchuser@example.com",
        username: "searchuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    // Create boards to search
    await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Project Alpha", type: "O" }),
    });
    await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Project Beta", type: "O" }),
    });
    await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Sprint Planning", type: "O" }),
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

  describe("GET /api/v2/boards/search", () => {
    test("searches boards by term", async () => {
      const res = await authRequest("/api/v2/boards/search?q=Project");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBe(2);
    });

    test("returns 400 for empty search term", async () => {
      const res = await authRequest("/api/v2/boards/search");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/v2/teams/:teamID/boards/search", () => {
    test("searches boards in team", async () => {
      const res = await authRequest("/api/v2/teams/team-1/boards/search?q=Sprint");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBe(1);
      expect(body[0].title).toBe("Sprint Planning");
    });
  });

  describe("GET /api/v2/teams/:teamID/boards/search/linkable", () => {
    test("searches linkable boards", async () => {
      const res = await authRequest("/api/v2/teams/team-1/boards/search/linkable?q=Alpha");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBe(1);
    });
  });

  describe("GET /api/v2/teams/:teamID/channels", () => {
    test("returns empty array (standalone stub)", async () => {
      const res = await authRequest("/api/v2/teams/team-1/channels");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual([]);
    });
  });
});
