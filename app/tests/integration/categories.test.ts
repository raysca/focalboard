import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Category routes", () => {
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
        email: "catuser@example.com",
        username: "catuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Cat Test Board", type: "O" }),
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

  let categoryId: string;
  let category2Id: string;

  describe("POST /api/v2/teams/:teamID/categories", () => {
    test("creates a category", async () => {
      const res = await authRequest("/api/v2/teams/team-1/categories", {
        method: "POST",
        body: JSON.stringify({ name: "Important" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.name).toBe("Important");
      expect(body.teamId).toBe("team-1");
      categoryId = body.id;
    });

    test("creates a second category", async () => {
      const res = await authRequest("/api/v2/teams/team-1/categories", {
        method: "POST",
        body: JSON.stringify({ name: "Archive" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      category2Id = body.id;
    });
  });

  describe("GET /api/v2/teams/:teamID/categories", () => {
    test("lists user categories", async () => {
      const res = await authRequest("/api/v2/teams/team-1/categories");
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body[0].boardMetadata).toBeDefined();
    });
  });

  describe("PUT /api/v2/teams/:teamID/categories/:categoryID", () => {
    test("updates category name", async () => {
      const res = await authRequest(`/api/v2/teams/team-1/categories/${categoryId}`, {
        method: "PUT",
        body: JSON.stringify({ name: "Very Important" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.name).toBe("Very Important");
    });
  });

  describe("PUT /api/v2/teams/:teamID/categories/reorder", () => {
    test("reorders categories", async () => {
      const res = await authRequest("/api/v2/teams/team-1/categories/reorder", {
        method: "PUT",
        body: JSON.stringify([category2Id, categoryId]),
      });
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/v2/teams/:teamID/categories/:categoryID/boards/:boardID", () => {
    test("assigns board to category", async () => {
      const res = await authRequest(
        `/api/v2/teams/team-1/categories/${categoryId}/boards/${boardId}`,
        { method: "POST" },
      );
      expect(res.status).toBe(200);

      // Verify in category list
      const catRes = await authRequest("/api/v2/teams/team-1/categories");
      const cats = await catRes.json();
      const cat = cats.find((c: any) => c.id === categoryId);
      expect(cat.boardMetadata.length).toBeGreaterThanOrEqual(1);
      expect(cat.boardMetadata[0].boardId).toBe(boardId);
    });
  });

  describe("PUT hide/unhide board in category", () => {
    test("hides a board", async () => {
      const res = await authRequest(
        `/api/v2/teams/team-1/categories/${categoryId}/boards/${boardId}/hide`,
        { method: "PUT" },
      );
      expect(res.status).toBe(200);
    });

    test("unhides a board", async () => {
      const res = await authRequest(
        `/api/v2/teams/team-1/categories/${categoryId}/boards/${boardId}/unhide`,
        { method: "PUT" },
      );
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/v2/teams/:teamID/categories/:categoryID", () => {
    test("soft deletes a category", async () => {
      const res = await authRequest(`/api/v2/teams/team-1/categories/${category2Id}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      // Verify not in list
      const listRes = await authRequest("/api/v2/teams/team-1/categories");
      const listBody = await listRes.json();
      const found = listBody.find((c: any) => c.id === category2Id);
      expect(found).toBeUndefined();
    });
  });
});
