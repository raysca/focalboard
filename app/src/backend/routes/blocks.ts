import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../errors.ts";
import { recordBlockHistory } from "../services/history.ts";

const blockRoutes = new Hono();

// GET /boards/:boardID/blocks
blockRoutes.get("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const parentId = c.req.query("parent_id");
  const type = c.req.query("type");

  let conditions = [eq(blocks.boardId, boardId), eq(blocks.deleteAt, 0)];
  if (parentId) conditions.push(eq(blocks.parentId, parentId));
  if (type) conditions.push(eq(blocks.type, type));

  const result = db
    .select()
    .from(blocks)
    .where(and(...conditions))
    .all();

  return c.json(result);
});

// POST /boards/:boardID/blocks
blockRoutes.post("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();

  const newBlocks: (typeof blocks.$inferInsert)[] = [];
  const items = Array.isArray(body) ? body : [body];

  for (const item of items) {
    const id = item.id || crypto.randomUUID();
    const block = {
      id,
      parentId: item.parentId ?? "",
      createdBy: item.createdBy ?? userId,
      modifiedBy: userId,
      schema: item.schema ?? 0,
      type: item.type ?? "",
      title: item.title ?? "",
      fields: item.fields ?? {},
      boardId,
      createAt: item.createAt ?? now,
      updateAt: now,
      deleteAt: 0,
    };
    newBlocks.push(block);
  }

  for (const block of newBlocks) {
    // Upsert: insert or replace
    const existing = db
      .select()
      .from(blocks)
      .where(eq(blocks.id, block.id!))
      .get();

    if (existing) {
      recordBlockHistory(db, block.id!);
      db.update(blocks)
        .set({
          ...block,
          createAt: existing.createAt,
        })
        .where(eq(blocks.id, block.id!))
        .run();
    } else {
      db.insert(blocks).values(block).run();
      recordBlockHistory(db, block.id!);
    }
  }

  return c.json(newBlocks);
});

// PATCH /boards/:boardID/blocks
blockRoutes.patch("/boards/:boardID/blocks", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();

  const items = Array.isArray(body) ? body : [body];

  for (const item of items) {
    if (!item.id) continue;
    const updates: Record<string, unknown> = {
      modifiedBy: userId,
      updateAt: now,
    };
    if (item.title !== undefined) updates.title = item.title;
    if (item.fields !== undefined) updates.fields = item.fields;
    if (item.parentId !== undefined) updates.parentId = item.parentId;
    if (item.type !== undefined) updates.type = item.type;
    if (item.schema !== undefined) updates.schema = item.schema;

    recordBlockHistory(db, item.id);
    db.update(blocks).set(updates).where(eq(blocks.id, item.id)).run();
  }

  return c.json({}, 200);
});

// DELETE /boards/:boardID/blocks/:blockID
blockRoutes.delete(
  "/boards/:boardID/blocks/:blockID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const userId = c.get("userId") as string;

    recordBlockHistory(db, blockId);
    db.update(blocks)
      .set({ deleteAt: Date.now(), modifiedBy: userId })
      .where(eq(blocks.id, blockId))
      .run();

    return c.json({}, 200);
  },
);

// PATCH /boards/:boardID/blocks/:blockID
blockRoutes.patch(
  "/boards/:boardID/blocks/:blockID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
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
    if (body.type !== undefined) updates.type = body.type;
    if (body.schema !== undefined) updates.schema = body.schema;

    recordBlockHistory(db, blockId);
    db.update(blocks).set(updates).where(eq(blocks.id, blockId)).run();

    const updated = db.select().from(blocks).where(eq(blocks.id, blockId)).get();
    if (!updated) throw new NotFoundError("block not found");

    return c.json(updated);
  },
);

// POST /boards/:boardID/blocks/:blockID/undelete
blockRoutes.post(
  "/boards/:boardID/blocks/:blockID/undelete",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const userId = c.get("userId") as string;

    db.update(blocks)
      .set({ deleteAt: 0, modifiedBy: userId, updateAt: Date.now() })
      .where(eq(blocks.id, blockId))
      .run();

    const block = db.select().from(blocks).where(eq(blocks.id, blockId)).get();
    if (!block) throw new NotFoundError("block not found");

    return c.json(block);
  },
);

// POST /boards/:boardID/blocks/:blockID/duplicate
blockRoutes.post(
  "/boards/:boardID/blocks/:blockID/duplicate",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const boardId = c.req.param("boardID");
    const userId = c.get("userId") as string;
    const now = Date.now();

    const original = db
      .select()
      .from(blocks)
      .where(eq(blocks.id, blockId))
      .get();

    if (!original) throw new NotFoundError("block not found");

    const newBlock = {
      ...original,
      id: crypto.randomUUID(),
      createdBy: userId,
      modifiedBy: userId,
      createAt: now,
      updateAt: now,
      deleteAt: 0,
    };

    db.insert(blocks).values(newBlock).run();

    // Duplicate child blocks
    const children = db
      .select()
      .from(blocks)
      .where(and(eq(blocks.parentId, blockId), eq(blocks.deleteAt, 0)))
      .all();

    for (const child of children) {
      db.insert(blocks)
        .values({
          ...child,
          id: crypto.randomUUID(),
          parentId: newBlock.id,
          createdBy: userId,
          modifiedBy: userId,
          createAt: now,
          updateAt: now,
        })
        .run();
    }

    return c.json(newBlock);
  },
);

export default blockRoutes;
