import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Block routes", () => {
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
        email: "blockuser@example.com",
        username: "blockuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    // Create a board to attach blocks to
    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Block Test Board", type: "O" }),
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

  let blockId: string;

  describe("POST /api/v2/boards/:boardID/blocks", () => {
    test("inserts blocks", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks`, {
        method: "POST",
        body: JSON.stringify([
          { type: "text", title: "Block A" },
          { type: "image", title: "Block B" },
        ]),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveLength(2);
      expect(body[0].id).toBeDefined();
      expect(body[0].type).toBe("text");
      expect(body[0].boardId).toBe(boardId);
      blockId = body[0].id;
    });

    test("upserts existing block", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks`, {
        method: "POST",
        body: JSON.stringify({ id: blockId, type: "text", title: "Updated Block A" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body[0].title).toBe("Updated Block A");
    });
  });

  describe("GET /api/v2/boards/:boardID/blocks", () => {
    test("lists blocks for a board", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBeGreaterThanOrEqual(2);
    });

    test("filters by type", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks?type=image`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBe(1);
      expect(body[0].type).toBe("image");
    });
  });

  describe("PATCH /api/v2/boards/:boardID/blocks/:blockID", () => {
    test("patches a single block", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Patched Title" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Patched Title");
    });
  });

  describe("PATCH /api/v2/boards/:boardID/blocks (batch)", () => {
    test("batch patches blocks", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks`, {
        method: "PATCH",
        body: JSON.stringify([{ id: blockId, title: "Batch Patched" }]),
      });
      expect(res.status).toBe(200);

      // Verify the patch took effect
      const getRes = await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({}),
      });
      const getBody = await getRes.json();
      expect(getBody.title).toBe("Batch Patched");
    });
  });

  describe("DELETE /api/v2/boards/:boardID/blocks/:blockID", () => {
    test("soft deletes a block", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      // Should not appear in the list
      const listRes = await authRequest(`/api/v2/boards/${boardId}/blocks?type=text`);
      const listBody = await listRes.json();
      const found = listBody.find((b: any) => b.id === blockId);
      expect(found).toBeUndefined();
    });
  });

  describe("POST /api/v2/boards/:boardID/blocks/:blockID/undelete", () => {
    test("restores a deleted block", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}/undelete`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.deleteAt).toBe(0);
      expect(body.id).toBe(blockId);
    });
  });

  describe("POST /api/v2/boards/:boardID/blocks/:blockID/duplicate", () => {
    test("duplicates a block", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}/duplicate`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).not.toBe(blockId);
      expect(body.boardId).toBe(boardId);
    });
  });
});
