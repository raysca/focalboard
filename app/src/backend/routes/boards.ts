import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {
  boards,
  blocks,
  boardMembers,
  sharing,
} from "../db/schema.ts";
import { sessionRequired, attachSession } from "../middleware/auth.ts";
import { eq, and, inArray } from "drizzle-orm";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "../errors.ts";
import { recordBoardHistory, recordMemberHistory } from "../services/history.ts";

const boardRoutes = new Hono();

// GET /teams/:teamID/boards
boardRoutes.get("/teams/:teamID/boards", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const teamId = c.req.param("teamID");
  const userId = c.get("userId") as string;

  // Get boards the user is a member of in this team
  const memberBoards = db
    .select({ boardId: boardMembers.boardId })
    .from(boardMembers)
    .where(eq(boardMembers.userId, userId))
    .all();

  const memberBoardIds = memberBoards.map((m) => m.boardId);
  if (memberBoardIds.length === 0) {
    return c.json([]);
  }

  const teamBoards = db
    .select()
    .from(boards)
    .where(
      and(
        eq(boards.teamId, teamId),
        eq(boards.deleteAt, 0),
        inArray(boards.id, memberBoardIds),
      ),
    )
    .all();

  return c.json(teamBoards);
});

// POST /boards
boardRoutes.post("/boards", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const now = Date.now();
  const id = crypto.randomUUID();

  const newBoard = {
    id,
    teamId: body.teamId ?? "",
    channelId: body.channelId ?? "",
    createdBy: userId,
    modifiedBy: userId,
    type: body.type ?? "O",
    minimumRole: body.minimumRole ?? "",
    title: body.title ?? "",
    description: body.description ?? "",
    icon: body.icon ?? "",
    showDescription: body.showDescription ?? false,
    isTemplate: body.isTemplate ?? false,
    templateVersion: body.templateVersion ?? 0,
    properties: body.properties ?? {},
    cardProperties: body.cardProperties ?? [],
    createAt: now,
    updateAt: now,
    deleteAt: 0,
  };

  db.insert(boards).values(newBoard).run();
  recordBoardHistory(db, id);

  // Auto-add creator as admin member
  db.insert(boardMembers)
    .values({
      boardId: id,
      userId,
      roles: "",
      minimumRole: "",
      schemeAdmin: true,
      schemeEditor: true,
      schemeCommenter: true,
      schemeViewer: true,
    })
    .run();
  recordMemberHistory(db, id, userId, "add");

  return c.json(newBoard);
});

// GET /boards/:boardID
boardRoutes.get("/boards/:boardID", attachSession, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string | undefined;
  const readToken = c.req.query("read_token");

  const board = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!board) {
    throw new NotFoundError("board not found");
  }

  // Check access: user is member, or has valid read_token
  if (userId) {
    const member = db
      .select()
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, userId),
        ),
      )
      .get();
    if (member) {
      return c.json(board);
    }
  }

  if (readToken) {
    const shareInfo = db
      .select()
      .from(sharing)
      .where(eq(sharing.id, boardId))
      .get();
    if (shareInfo?.enabled && shareInfo.token === readToken) {
      return c.json(board);
    }
  }

  if (!userId) {
    throw new ForbiddenError("access denied");
  }

  // If user is authenticated but not a member, check if board is open
  if (board.type === "O") {
    return c.json(board);
  }

  throw new ForbiddenError("access denied");
});

// PATCH /boards/:boardID
boardRoutes.patch("/boards/:boardID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();

  const existing = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!existing) {
    throw new NotFoundError("board not found");
  }

  const updates: Record<string, unknown> = {
    modifiedBy: userId,
    updateAt: Date.now(),
  };

  // Only patch provided fields
  const patchableFields = [
    "title",
    "description",
    "icon",
    "showDescription",
    "type",
    "minimumRole",
    "properties",
    "cardProperties",
    "isTemplate",
    "templateVersion",
    "channelId",
  ] as const;

  for (const field of patchableFields) {
    if (body[field] !== undefined) {
      updates[field] = body[field];
    }
  }

  recordBoardHistory(db, boardId);
  db.update(boards).set(updates).where(eq(boards.id, boardId)).run();

  const updated = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  return c.json(updated);
});

// DELETE /boards/:boardID
boardRoutes.delete("/boards/:boardID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const existing = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!existing) {
    throw new NotFoundError("board not found");
  }

  // Soft delete
  recordBoardHistory(db, boardId);
  db.update(boards)
    .set({ deleteAt: Date.now(), modifiedBy: userId })
    .where(eq(boards.id, boardId))
    .run();

  return c.json({}, 200);
});

// POST /boards/:boardID/duplicate
boardRoutes.post("/boards/:boardID/duplicate", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const original = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!original) {
    throw new NotFoundError("board not found");
  }

  const now = Date.now();
  const newBoardId = crypto.randomUUID();

  // Duplicate the board
  const newBoard = {
    ...original,
    id: newBoardId,
    createdBy: userId,
    modifiedBy: userId,
    createAt: now,
    updateAt: now,
    deleteAt: 0,
    title: `${original.title} copy`,
  };

  db.insert(boards).values(newBoard).run();

  // Duplicate blocks
  const boardBlocks = db
    .select()
    .from(blocks)
    .where(and(eq(blocks.boardId, boardId), eq(blocks.deleteAt, 0)))
    .all();

  const idMap = new Map<string, string>();
  for (const block of boardBlocks) {
    idMap.set(block.id, crypto.randomUUID());
  }

  for (const block of boardBlocks) {
    db.insert(blocks)
      .values({
        ...block,
        id: idMap.get(block.id)!,
        parentId: idMap.get(block.parentId) ?? block.parentId,
        boardId: newBoardId,
        createdBy: userId,
        modifiedBy: userId,
        createAt: now,
        updateAt: now,
      })
      .run();
  }

  // Add creator as admin member
  db.insert(boardMembers)
    .values({
      boardId: newBoardId,
      userId,
      roles: "",
      minimumRole: "",
      schemeAdmin: true,
      schemeEditor: true,
      schemeCommenter: true,
      schemeViewer: true,
    })
    .run();

  return c.json(newBoard);
});

// POST /boards/:boardID/undelete
boardRoutes.post("/boards/:boardID/undelete", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  db.update(boards)
    .set({ deleteAt: 0, modifiedBy: userId, updateAt: Date.now() })
    .where(eq(boards.id, boardId))
    .run();

  const board = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!board) {
    throw new NotFoundError("board not found");
  }

  return c.json(board);
});

// GET /boards/:boardID/metadata
boardRoutes.get("/boards/:boardID/metadata", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");

  const board = db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .get();

  if (!board) {
    throw new NotFoundError("board not found");
  }

  // Count blocks
  const boardBlocks = db
    .select()
    .from(blocks)
    .where(and(eq(blocks.boardId, boardId), eq(blocks.deleteAt, 0)))
    .all();

  return c.json({
    boardId: board.id,
    createdBy: board.createdBy,
    modifiedBy: board.modifiedBy,
    createAt: board.createAt,
    updateAt: board.updateAt,
    descendantCount: boardBlocks.length,
  });
});

export default boardRoutes;
