import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import {
  teams,
  boardsHistory,
  blocksHistory,
  boardMembersHistory,
} from "../../src/backend/db/schema.ts";
import { eq } from "drizzle-orm";

describe("History tracking", () => {
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
        email: "histuser@example.com",
        username: "histuser",
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

  describe("Board history", () => {
    test("records history on board create", async () => {
      const res = await authRequest("/api/v2/boards", {
        method: "POST",
        body: JSON.stringify({ teamId: "team-1", title: "History Board", type: "O" }),
      });
      const body = await res.json();
      boardId = body.id;

      const history = db
        .select()
        .from(boardsHistory)
        .where(eq(boardsHistory.id, boardId))
        .all();
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].title).toBe("History Board");
      expect(history[0].insertAt).toBeGreaterThan(0);
    });

    test("records history on board patch", async () => {
      await authRequest(`/api/v2/boards/${boardId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated History Board" }),
      });

      const history = db
        .select()
        .from(boardsHistory)
        .where(eq(boardsHistory.id, boardId))
        .all();
      // Should have at least 2 entries (create + pre-patch snapshot)
      expect(history.length).toBeGreaterThanOrEqual(2);
    });

    test("records history on board delete", async () => {
      await authRequest(`/api/v2/boards/${boardId}`, { method: "DELETE" });

      const history = db
        .select()
        .from(boardsHistory)
        .where(eq(boardsHistory.id, boardId))
        .all();
      expect(history.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Block history", () => {
    test("records history on block create and patch", async () => {
      // Undelete board first
      await authRequest(`/api/v2/boards/${boardId}/undelete`, { method: "POST" });

      const createRes = await authRequest(`/api/v2/boards/${boardId}/blocks`, {
        method: "POST",
        body: JSON.stringify({ type: "text", title: "History Block" }),
      });
      const blocks = await createRes.json();
      const blockId = blocks[0].id;

      // Check history after create
      let history = db
        .select()
        .from(blocksHistory)
        .where(eq(blocksHistory.id, blockId))
        .all();
      expect(history.length).toBeGreaterThanOrEqual(1);

      // Patch block
      await authRequest(`/api/v2/boards/${boardId}/blocks/${blockId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Patched History Block" }),
      });

      history = db
        .select()
        .from(blocksHistory)
        .where(eq(blocksHistory.id, blockId))
        .all();
      expect(history.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Board member history", () => {
    test("records history on member add and board create", async () => {
      const history = db
        .select()
        .from(boardMembersHistory)
        .where(eq(boardMembersHistory.boardId, boardId))
        .all();
      // Board creation auto-adds the creator, which should record history
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history[0].action).toBe("add");
    });
  });
});
