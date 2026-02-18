import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams, boards, boardMembers } from "../../src/backend/db/schema.ts";

describe("Member routes", () => {
  let app: Hono;
  let db: any;
  let authToken: string;
  let userId: string;
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
        email: "memberuser@example.com",
        username: "memberuser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    // Get user ID
    const meRes = await authRequest("/api/v2/users/me");
    const meBody = await meRes.json();
    userId = meBody.id;

    // Create a board (creator is auto-added as member)
    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Member Test Board", type: "O" }),
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

  describe("GET /api/v2/boards/:boardID/members", () => {
    test("lists board members", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/members`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBeGreaterThanOrEqual(1);
      expect(body[0].boardId).toBe(boardId);
    });
  });

  describe("POST /api/v2/boards/:boardID/members", () => {
    test("adds a member", async () => {
      const newUserId = "user-to-add";
      const res = await authRequest(`/api/v2/boards/${boardId}/members`, {
        method: "POST",
        body: JSON.stringify({
          userId: newUserId,
          schemeEditor: true,
          schemeViewer: true,
        }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.userId).toBe(newUserId);
      expect(body.boardId).toBe(boardId);
    });
  });

  describe("PUT /api/v2/boards/:boardID/members/:userID", () => {
    test("updates a member role", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/members/user-to-add`, {
        method: "PUT",
        body: JSON.stringify({ schemeAdmin: true }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.schemeAdmin).toBe(true);
    });
  });

  describe("DELETE /api/v2/boards/:boardID/members/:userID", () => {
    test("removes a member", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/members/user-to-add`, {
        method: "DELETE",
      });
      expect(res.status).toBe(200);

      // Verify removed
      const listRes = await authRequest(`/api/v2/boards/${boardId}/members`);
      const listBody = await listRes.json();
      const found = listBody.find((m: any) => m.userId === "user-to-add");
      expect(found).toBeUndefined();
    });
  });

  describe("POST /api/v2/boards/:boardID/join", () => {
    test("joins an open board", async () => {
      // Create a new open board without membership
      const now = Date.now();
      const openBoardId = crypto.randomUUID();
      db.insert(boards)
        .values({
          id: openBoardId,
          teamId: "team-1",
          type: "O",
          title: "Open Board",
          createdBy: "someone-else",
          modifiedBy: "someone-else",
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();

      const res = await authRequest(`/api/v2/boards/${openBoardId}/join`, {
        method: "POST",
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.boardId).toBe(openBoardId);
      expect(body.userId).toBe(userId);
    });

    test("rejects joining a private board", async () => {
      const privateBoardId = crypto.randomUUID();
      const now = Date.now();
      db.insert(boards)
        .values({
          id: privateBoardId,
          teamId: "team-1",
          type: "P",
          title: "Private Board",
          createdBy: "someone-else",
          modifiedBy: "someone-else",
          createAt: now,
          updateAt: now,
          deleteAt: 0,
        })
        .run();

      const res = await authRequest(`/api/v2/boards/${privateBoardId}/join`, {
        method: "POST",
      });
      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v2/boards/:boardID/leave", () => {
    test("leaves a board", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/leave`, {
        method: "POST",
      });
      expect(res.status).toBe(200);

      // Verify no longer a member
      const listRes = await authRequest(`/api/v2/boards/${boardId}/members`);
      const listBody = await listRes.json();
      const found = listBody.find((m: any) => m.userId === userId);
      expect(found).toBeUndefined();
    });
  });

  describe("Authorization and edge cases", () => {
    let secondUserId: string;
    let secondAuthToken: string;

    beforeAll(async () => {
      const reg2Res = await testRequest(app, "/api/v2/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "nonadmin@example.com",
          username: "nonadmin",
          password: "password123",
        }),
      });
      const reg2Body = await reg2Res.json();
      secondAuthToken = reg2Body.token;

      const me2Headers = new Headers();
      me2Headers.set("X-Requested-With", "XMLHttpRequest");
      me2Headers.set("Authorization", `Bearer ${secondAuthToken}`);
      const me2Res = await app.request("/api/v2/users/me", { headers: me2Headers });
      secondUserId = (await me2Res.json()).id;
    });

    function nonAdminRequest(path: string, options: RequestInit = {}) {
      const headers = new Headers(options.headers);
      headers.set("X-Requested-With", "XMLHttpRequest");
      headers.set("Authorization", `Bearer ${secondAuthToken}`);
      if (!headers.has("Content-Type") && options.body) {
        headers.set("Content-Type", "application/json");
      }
      return app.request(path, { ...options, headers });
    }

    async function createTestBoard(title: string) {
      const res = await authRequest("/api/v2/boards", {
        method: "POST",
        body: JSON.stringify({ teamId: "team-1", title, type: "O" }),
      });
      return (await res.json()).id as string;
    }

    test("non-admin cannot add member", async () => {
      const testBoardId = await createTestBoard("AuthTest Board 1");
      await authRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: secondUserId, schemeEditor: true }),
      });
      const res = await nonAdminRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: "some-other-user", schemeEditor: true }),
      });
      expect(res.status).toBe(403);
    });

    test("non-admin cannot update member role", async () => {
      const testBoardId = await createTestBoard("AuthTest Board 2");
      await authRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: secondUserId, schemeEditor: true }),
      });
      const res = await nonAdminRequest(`/api/v2/boards/${testBoardId}/members/${userId}`, {
        method: "PUT",
        body: JSON.stringify({ schemeAdmin: true }),
      });
      expect(res.status).toBe(403);
    });

    test("non-admin cannot remove member", async () => {
      const testBoardId = await createTestBoard("AuthTest Board 3");
      await authRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: secondUserId, schemeEditor: true }),
      });
      const res = await nonAdminRequest(`/api/v2/boards/${testBoardId}/members/${userId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(403);
    });

    test("cannot remove last admin", async () => {
      const testBoardId = await createTestBoard("LastAdmin Board");
      // Attempt to remove self (the only admin)
      const res = await authRequest(`/api/v2/boards/${testBoardId}/members/${userId}`, {
        method: "DELETE",
      });
      expect(res.status).toBe(400);
    });

    test("adding duplicate member returns error", async () => {
      const testBoardId = await createTestBoard("Duplicate Board");
      await authRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: secondUserId, schemeEditor: true }),
      });
      // Add same user again
      const res = await authRequest(`/api/v2/boards/${testBoardId}/members`, {
        method: "POST",
        body: JSON.stringify({ userId: secondUserId, schemeEditor: true }),
      });
      expect(res.status).toBe(400);
    });
  });
});
