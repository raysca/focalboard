import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { NotFoundError, BadRequestError } from "../errors.ts";

const cardRoutes = new Hono();

// GET /boards/:boardID/cards
cardRoutes.get("/boards/:boardID/cards", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const page = parseInt(c.req.query("page") ?? "0");
  const perPage = parseInt(c.req.query("per_page") ?? "50");

  const cards = db
    .select()
    .from(blocks)
    .where(
      and(
        eq(blocks.boardId, boardId),
        eq(blocks.type, "card"),
        eq(blocks.deleteAt, 0),
      ),
    )
    .limit(perPage)
    .offset(page * perPage)
    .all();

  return c.json(cards);
});

// POST /boards/:boardID/cards
cardRoutes.post("/boards/:boardID/cards", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();
  const id = crypto.randomUUID();

  const card = {
    id,
    parentId: body.parentId ?? "",
    createdBy: userId,
    modifiedBy: userId,
    schema: body.schema ?? 0,
    type: "card" as const,
    title: body.title ?? "",
    fields: body.fields ?? {},
    boardId,
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  };

  db.insert(blocks).values(card).run();

  return c.json(card);
});

// GET /cards/:cardID
cardRoutes.get("/cards/:cardID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const cardId = c.req.param("cardID");

  const card = db
    .select()
    .from(blocks)
    .where(and(eq(blocks.id, cardId), eq(blocks.type, "card")))
    .get();

  if (!card) throw new NotFoundError("card not found");

  return c.json(card);
});

// PATCH /cards/:cardID
cardRoutes.patch("/cards/:cardID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const cardId = c.req.param("cardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();

  const updates: Record<string, unknown> = {
    modifiedBy: userId,
    updateAt: now,
  };
  if (body.title !== undefined) updates.title = body.title;
  if (body.fields !== undefined) updates.fields = body.fields;
  if (body.parentId !== undefined) updates.parentId = body.parentId;

  db.update(blocks).set(updates).where(eq(blocks.id, cardId)).run();

  const updated = db.select().from(blocks).where(eq(blocks.id, cardId)).get();
  if (!updated) throw new NotFoundError("card not found");

  return c.json(updated);
});

export default cardRoutes;
