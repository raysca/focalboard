import { describe, test, expect, beforeAll } from "bun:test";
import type { Hono } from "hono";
import { createTestApp, testRequest } from "../setup.ts";
import { teams } from "../../src/backend/db/schema.ts";

describe("Card routes", () => {
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
        email: "carduser@example.com",
        username: "carduser",
        password: "password123",
      }),
    });
    const regBody = await regRes.json();
    authToken = regBody.token;

    const boardRes = await authRequest("/api/v2/boards", {
      method: "POST",
      body: JSON.stringify({ teamId: "team-1", title: "Card Test Board", type: "O" }),
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

  let cardId: string;

  describe("POST /api/v2/boards/:boardID/cards", () => {
    test("creates a card", async () => {
      const res = await authRequest(`/api/v2/boards/${boardId}/cards`, {
        method: "POST",
        body: JSON.stringify({ title: "Test Card", fields: { priority: "high" } }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBeDefined();
      expect(body.title).toBe("Test Card");
      expect(body.type).toBe("card");
      expect(body.boardId).toBe(boardId);
      cardId = body.id;
    });
  });

  describe("GET /api/v2/boards/:boardID/cards", () => {
    test("lists cards with pagination", async () => {
      // Create a second card
      await authRequest(`/api/v2/boards/${boardId}/cards`, {
        method: "POST",
        body: JSON.stringify({ title: "Card 2" }),
      });

      const res = await authRequest(`/api/v2/boards/${boardId}/cards`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.length).toBeGreaterThanOrEqual(2);
      expect(body.every((c: any) => c.type === "card")).toBe(true);
    });
  });

  describe("GET /api/v2/cards/:cardID", () => {
    test("gets a card by ID", async () => {
      const res = await authRequest(`/api/v2/cards/${cardId}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.id).toBe(cardId);
      expect(body.title).toBe("Test Card");
    });

    test("returns 404 for nonexistent card", async () => {
      const res = await authRequest("/api/v2/cards/nonexistent");
      expect(res.status).toBe(404);
    });
  });

  describe("PATCH /api/v2/cards/:cardID", () => {
    test("patches card title", async () => {
      const res = await authRequest(`/api/v2/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ title: "Updated Card" }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.title).toBe("Updated Card");
    });

    test("patches card fields", async () => {
      const res = await authRequest(`/api/v2/cards/${cardId}`, {
        method: "PATCH",
        body: JSON.stringify({ fields: { priority: "low", status: "done" } }),
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.fields).toEqual({ priority: "low", status: "done" });
    });
  });
});
