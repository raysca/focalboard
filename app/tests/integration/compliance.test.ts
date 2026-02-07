import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams, userProfiles } from "../../src/backend/db/schema.ts";
import { eq } from "drizzle-orm";

describe("Compliance routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;

    db.insert(teams).values({ id: "team-1", title: "Test Team" }).run();

    const regRes = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "adminuser@example.com",
        username: "adminuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    // Get user ID
    const meRes = await authRequest("/api/v2/users/me");
    const meBody = await meRes.json();
    userId = meBody.id;

    // Make user an admin
    db.update(userProfiles)
      .set({ roles: "admin" })
      .where(eq(userProfiles.userId, userId))
      .run();

    // Create a board for compliance queries
    await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Compliance Board", type: "O" }),
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

  describe("GET /api/v2/admin/boards", () => {
    test("lists boards for admin", async () => {
      const res = await authRequest("/api/v2/admin/boards");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toBeDefined();
      expect(body.results.length).toBeGreaterThanOrEqual(1);
      expect(typeof body.hasMore).toBe("boolean");
    });

    test("filters by team_id", async () => {
      const res = await authRequest("/api/v2/admin/boards?team_id=team-1");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Non-admin access", () => {
    test("rejects non-admin user", async () => {
      // Register a non-admin user
      const regRes = await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonadmin@example.com",
          username: "nonadmin",
          password: "password123",
        }),
      });
      const regBody = await regRes.json();
      const nonAdminToken = regBody.token;

      const headers = new Headers();
      headers.set("X-Requested-With", "XMLHttpRequest");
      headers.set("Authorization", `Bearer ${nonAdminToken}`);
      const res = await app.request("/api/v2/admin/boards", { headers });
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v2/admin/boards_history", () => {
    test("lists board history", async () => {
      const res = await authRequest("/api/v2/admin/boards_history");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toBeDefined();
      expect(typeof body.hasMore).toBe("boolean");
    });
  });

  describe("GET /api/v2/admin/blocks_history", () => {
    test("lists block history", async () => {
      const res = await authRequest("/api/v2/admin/blocks_history");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.results).toBeDefined();
      expect(typeof body.hasMore).toBe("boolean");
    });
  });
});
