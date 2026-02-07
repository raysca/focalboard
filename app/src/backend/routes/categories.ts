import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { categories, categoryBoards } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../errors.ts";

const categoryRoutes = new Hono();

// GET /teams/:teamID/categories
categoryRoutes.get(
  "/teams/:teamID/categories",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const userId = c.get("userId") as string;

    const cats = db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.userId, userId),
          eq(categories.teamId, teamId),
          eq(categories.deleteAt, 0),
        ),
      )
      .all();

    // Attach board metadata to each category
    const result = cats.map((cat) => {
      const catBoards = db
        .select()
        .from(categoryBoards)
        .where(
          and(
            eq(categoryBoards.categoryId, cat.id),
            eq(categoryBoards.deleteAt, 0),
          ),
        )
        .all();

      return {
        ...cat,
        boardMetadata: catBoards.map((cb) => ({
          boardId: cb.boardId,
          hidden: cb.hidden,
          sortOrder: cb.sortOrder,
        })),
      };
    });

    return c.json(result);
  },
);

// POST /teams/:teamID/categories
categoryRoutes.post(
  "/teams/:teamID/categories",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const userId = c.get("userId") as string;
    const body = await c.req.json();
    const now = Date.now();
    const id = crypto.randomUUID();

    const cat = {
      id,
      name: body.name ?? "",
      userId,
      teamId,
      createAt: now,
      updateAt: now,
      deleteAt: 0,
      collapsed: body.collapsed ?? false,
      sortOrder: body.sortOrder ?? 0,
      sorting: body.sorting ?? "",
      type: body.type ?? "custom",
    };

    db.insert(categories).values(cat).run();

    return c.json(cat);
  },
);

// PUT /teams/:teamID/categories/reorder
categoryRoutes.put(
  "/teams/:teamID/categories/reorder",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const body: string[] = await c.req.json();

    for (let i = 0; i < body.length; i++) {
      db.update(categories)
        .set({ sortOrder: i })
        .where(eq(categories.id, body[i]!))
        .run();
    }

    return c.json({}, 200);
  },
);

// PUT /teams/:teamID/categories/:categoryID
categoryRoutes.put(
  "/teams/:teamID/categories/:categoryID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const categoryId = c.req.param("categoryID");
    const body = await c.req.json();
    const now = Date.now();

    const updates: Record<string, unknown> = { updateAt: now };
    if (body.name !== undefined) updates.name = body.name;
    if (body.collapsed !== undefined) updates.collapsed = body.collapsed;
    if (body.sorting !== undefined) updates.sorting = body.sorting;

    db.update(categories)
      .set(updates)
      .where(eq(categories.id, categoryId))
      .run();

    const updated = db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .get();

    return c.json(updated);
  },
);

// DELETE /teams/:teamID/categories/:categoryID
categoryRoutes.delete(
  "/teams/:teamID/categories/:categoryID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const categoryId = c.req.param("categoryID");

    db.update(categories)
      .set({ deleteAt: Date.now() })
      .where(eq(categories.id, categoryId))
      .run();

    return c.json({}, 200);
  },
);

// PUT /teams/:teamID/categories/:categoryID/boards/reorder
categoryRoutes.put(
  "/teams/:teamID/categories/:categoryID/boards/reorder",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const body: string[] = await c.req.json();

    for (let i = 0; i < body.length; i++) {
      db.update(categoryBoards)
        .set({ sortOrder: i })
        .where(eq(categoryBoards.id, body[i]!))
        .run();
    }

    return c.json({}, 200);
  },
);

// POST /teams/:teamID/categories/:categoryID/boards/:boardID
categoryRoutes.post(
  "/teams/:teamID/categories/:categoryID/boards/:boardID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const categoryId = c.req.param("categoryID");
    const boardId = c.req.param("boardID");
    const userId = c.get("userId") as string;
    const now = Date.now();

    // Remove from any existing category
    db.update(categoryBoards)
      .set({ deleteAt: now })
      .where(
        and(
          eq(categoryBoards.userId, userId),
          eq(categoryBoards.boardId, boardId),
          eq(categoryBoards.deleteAt, 0),
        ),
      )
      .run();

    // Add to new category
    db.insert(categoryBoards)
      .values({
        id: crypto.randomUUID(),
        userId,
        categoryId,
        boardId,
        hidden: false,
        createAt: now,
        updateAt: now,
        deleteAt: 0,
        sortOrder: 0,
      })
      .run();

    return c.json({}, 200);
  },
);

// PUT /teams/:teamID/categories/:categoryID/boards/:boardID/hide
categoryRoutes.put(
  "/teams/:teamID/categories/:categoryID/boards/:boardID/hide",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const categoryId = c.req.param("categoryID");
    const boardId = c.req.param("boardID");

    db.update(categoryBoards)
      .set({ hidden: true, updateAt: Date.now() })
      .where(
        and(
          eq(categoryBoards.categoryId, categoryId),
          eq(categoryBoards.boardId, boardId),
          eq(categoryBoards.deleteAt, 0),
        ),
      )
      .run();

    return c.json({}, 200);
  },
);

// PUT /teams/:teamID/categories/:categoryID/boards/:boardID/unhide
categoryRoutes.put(
  "/teams/:teamID/categories/:categoryID/boards/:boardID/unhide",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const categoryId = c.req.param("categoryID");
    const boardId = c.req.param("boardID");

    db.update(categoryBoards)
      .set({ hidden: false, updateAt: Date.now() })
      .where(
        and(
          eq(categoryBoards.categoryId, categoryId),
          eq(categoryBoards.boardId, boardId),
          eq(categoryBoards.deleteAt, 0),
        ),
      )
      .run();

    return c.json({}, 200);
  },
);

export default categoryRoutes;
