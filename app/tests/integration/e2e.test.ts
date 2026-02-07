import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

/**
 * End-to-end smoke test covering the full Focalboard workflow:
 * Register -> Login -> Create board -> Create cards -> Patch card ->
 * Add member -> Enable sharing -> Search -> Export archive ->
 * Create category -> Statistics -> Delete board -> Logout
 */
describe("E2E smoke test", () => {
  let app: Hono;
  let db: any;
  let authToken: string;
  let userId: string;
  let boardId: string;
  let cardId: string;
  let categoryId: string;

  beforeAll(() => {
    const testEnv = createTestApp();
    app = testEnv.app;
    db = testEnv.db;
    db.insert(teams).values({ id: "team-1", title: "E2E Team" }).run();
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

  test("1. Register user", async () => {
    const res = await testRequest(app, "/api/v2/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "e2e@example.com",
        username: "e2euser",
        password: "password123",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.token).toBeDefined();
    authToken = body.token;
  });

  test("2. Get current user", async () => {
    const res = await authRequest("/api/v2/users/me");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.email).toBe("e2e@example.com");
    userId = body.id;
  });

  test("3. Create board", async () => {
    const res = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({
        teamId: "team-1",
        title: "E2E Board",
        type: "O",
        description: "End-to-end test board",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.id).toBeDefined();
    expect(body.title).toBe("E2E Board");
    boardId = body.id;
  });

  test("4. Create cards on board", async () => {
    const res1 = await authRequest(`/api/v2/boards/${boardId}/cards`, {
      method: "POST",
      body: JSON.stringify({ title: "Task A", fields: { priority: "high" } }),
    });
    expect(res1.status).toBe(200);
    const card1 = await res1.json();
    cardId = card1.id;

    const res2 = await authRequest(`/api/v2/boards/${boardId}/cards`, {
      method: "POST",
      body: JSON.stringify({ title: "Task B", fields: { priority: "low" } }),
    });
    expect(res2.status).toBe(200);
  });

  test("5. Patch card properties", async () => {
    const res = await authRequest(`/api/v2/cards/${cardId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: "Task A (Updated)",
        fields: { priority: "critical", status: "in_progress" },
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.title).toBe("Task A (Updated)");
    expect(body.fields.priority).toBe("critical");
  });

  test("6. List board members (creator should be admin)", async () => {
    const res = await authRequest(`/api/v2/boards/${boardId}/members`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].userId).toBe(userId);
    expect(body[0].schemeAdmin).toBe(true);
  });

  test("7. Enable sharing", async () => {
    const res = await authRequest(`/api/v2/boards/${boardId}/sharing`, {
      method: "POST",
      body: JSON.stringify({ enabled: true }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.token).toBeDefined();
  });

  test("8. Search for board by title", async () => {
    const res = await authRequest("/api/v2/boards/search?q=E2E");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.length).toBe(1);
    expect(body[0].title).toBe("E2E Board");
  });

  test("9. Export board archive", async () => {
    const res = await authRequest(`/api/v2/boards/${boardId}/archive/export`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.version).toBe(2);
    expect(body.boards).toHaveLength(1);
    expect(body.blocks.length).toBeGreaterThanOrEqual(2);
  });

  test("10. Create category and assign board", async () => {
    const catRes = await authRequest("/api/v2/teams/team-1/categories", {
      method: "POST",
      body: JSON.stringify({ name: "E2E Category" }),
    });
    expect(catRes.status).toBe(200);
    const cat = await catRes.json();
    categoryId = cat.id;

    const assignRes = await authRequest(
      `/api/v2/teams/team-1/categories/${categoryId}/boards/${boardId}`,
      { method: "POST" },
    );
    expect(assignRes.status).toBe(200);

    // Verify category lists the board
    const listRes = await authRequest("/api/v2/teams/team-1/categories");
    const cats = await listRes.json();
    const foundCat = cats.find((c: any) => c.id === categoryId);
    expect(foundCat.boardMetadata.length).toBe(1);
    expect(foundCat.boardMetadata[0].boardId).toBe(boardId);
  });

  test("11. Get statistics", async () => {
    const res = await authRequest("/api/v2/statistics");
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.board_count).toBeGreaterThanOrEqual(1);
    expect(body.card_count).toBeGreaterThanOrEqual(2);
  });

  test("12. Get board metadata", async () => {
    const res = await authRequest(`/api/v2/boards/${boardId}/metadata`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.boardId).toBe(boardId);
    expect(body.descendantCount).toBeGreaterThanOrEqual(2);
  });

  test("13. Delete board (soft delete)", async () => {
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

  test("14. Verify board is soft-deleted (can undelete)", async () => {
    const res = await authRequest(`/api/v2/boards/${boardId}/undelete`, {
      method: "POST",
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.deleteAt).toBe(0);
    expect(body.title).toBe("E2E Board");
  });

  test("15. Logout", async () => {
    const res = await authRequest("/api/v2/logout", { method: "POST" });
    expect(res.status).toBe(200);
  });
});
