import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";

describe("Board routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;

  beforeAll(async () => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;

    // Create a team
    db.insert(teams).values({ id: "team-1", title: "Test Team" }).run();

    // Register and login to get a token
    const regRes = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "boarduser@example.com",
        username: "boarduser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;
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

  let boardId: string;

  describe("POST /api/v2/boards", () => {
    test("creates a board", async () => {
      const res = await authRequest("/api/v2/boards", {
        method: "POST",
        body: JSON.stringify({
          teamId: "team-1",
          title: "Test Board",
          type: "O",
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe("Test Board");
      expect(body.teamId).toBe("team-1");
      expect(body.type).toBe("O");
      boardId = body.id;
    });
  });

  describe("GET /api/v2/boards/:boardID", () => {
    test("gets a board by ID", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(boardId);
      expect(body.title).toBe("Test Board");
    });
  });

  describe("PATCH /api/v2/boards/:boardID", () => {
    test("patches board title", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Board" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Updated Board");
    });

    test("patches board description", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ description: "New desc" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.description).toBe("New desc");
    });
  });

  describe("DELETE /api/v2/boards/:boardID", () => {
    test("soft deletes a board", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      // Board should not appear in team boards list
      const listRes = await authRequest("/api/v2/teams/team-1/boards");
      const listBody = await listRes.json();
      const found = listBody.find((b: any) => b.id === boardId);
      expect(found).toBeUndefined();
    });
  });

  describe("POST /api/v2/boards/:boardID/undelete", () => {
    test("restores a deleted board", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/undelete`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleteAt).toBe(0);
    });
  });

  describe("POST /api/v2/boards/:boardID/duplicate", () => {
    test("duplicates a board", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/duplicate`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).not.toBe(boardId);
      expect(body.title).toContain("copy");
    });
  });

  describe("GET /api/v2/boards/:boardID/metadata", () => {
    test("returns board metadata", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/metadata`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.boardId).toBe(boardId);
      expect(typeof body.descendantCount).toBe("number");
    });
  });

  describe("GET /api/v2/teams/:teamID/boards", () => {
    test("lists boards for team", async () => {
      const res = await authRequest("/api/v2/teams/team-1/boards");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
    });
  });
});
