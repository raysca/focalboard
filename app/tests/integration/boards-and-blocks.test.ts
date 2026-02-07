import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Boards-and-blocks routes", () => {
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
        email: "babuser@example.com",
        username: "babuser",
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

  let createdBoardId: string;
  let createdBlockId: string;

  describe("POST /api/v2/boards-and-blocks", () => {
    test("creates boards and blocks atomically", async () => {
      const res = await authRequest("/api/v2/boards-and-blocks", {
        method: "POST",
        body: JSON.stringify({
          boards: [{ teamId: "team-1", title: "Atomic Board", type: "O" }],
          blocks: [{ type: "card", title: "Atomic Card" }],
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.boards).toHaveLength(1);
      expect(body.blocks).toHaveLength(1);
      expect(body.boards[0].id).toBeDefined();
      expect(body.blocks[0].id).toBeDefined();
      createdBoardId = body.boards[0].id;
      createdBlockId = body.blocks[0].id;
    });
  });

  describe("PATCH /api/v2/boards-and-blocks", () => {
    test("patches boards and blocks atomically", async () => {
      const res = await authRequest("/api/v2/boards-and-blocks", {
        method: "PATCH",
        body: JSON.stringify({
          boards: [{ id: createdBoardId, title: "Patched Atomic Board" }],
          blocks: [{ id: createdBlockId, title: "Patched Atomic Card" }],
        }),
      });
      expect(res.status).toBe(200);

      // Verify board patched
      const boardRes = await authRequest(`/api/v2/boards/${createdBoardId}`);
      const boardBody = await boardRes.json();
      expect(boardBody.title).toBe("Patched Atomic Board");
    });
  });

  describe("DELETE /api/v2/boards-and-blocks", () => {
    test("soft deletes boards and blocks atomically", async () => {
      const res = await authRequest("/api/v2/boards-and-blocks", {
        method: "DELETE",
        body: JSON.stringify({
          boards: [createdBoardId],
          blocks: [createdBlockId],
        }),
      });
      expect(res.status).toBe(200);

      // Board should not appear in team list
      const listRes = await authRequest("/api/v2/teams/team-1/boards");
      const listBody = await listRes.json();
      const found = listBody.find((b: any) => b.id === createdBoardId);
      expect(found).toBeUndefined();
    });
  });
});
