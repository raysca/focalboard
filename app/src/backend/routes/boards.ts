import {Hono} from "hono";
import type {BunSQLiteDatabase} from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {blocks} from "../db/schema.ts";
import {sessionRequired, attachSession} from "../middleware/auth.ts";
import {eq, and} from "drizzle-orm";
import {NotFoundError} from "../errors.ts";
import {createBoardService} from "../services/board.ts";
import {createBlockRepository} from "../repositories/block.repository.ts";
import {validateRequest} from "../validation/middleware.ts";
import {createBoardSchema, updateBoardSchema} from "../validation/schemas.ts";

const boardRoutes = new Hono();

// GET /teams/:teamID/boards
boardRoutes.get("/teams/:teamID/boards", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const teamId = c.req.param("teamID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  const teamBoards = boardService.listByTeam(userId, teamId);

  return c.json(teamBoards);
});

// POST /boards
boardRoutes.post("/boards", sessionRequired, validateRequest(createBoardSchema), async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;
  const data = c.get("validatedData");

  const boardService = createBoardService(db, c.get("eventService"));
  const board = await boardService.create(userId, data);

  return c.json(board);
});

// GET /boards/:boardID
boardRoutes.get("/boards/:boardID", attachSession, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string | undefined;
  const readToken = c.req.query("read_token");

  const boardService = createBoardService(db, c.get("eventService"));
  const board = boardService.getByIdOrFail(boardId, userId, readToken);

  return c.json(board);
});

// PATCH /boards/:boardID
boardRoutes.patch("/boards/:boardID", sessionRequired, validateRequest(updateBoardSchema), async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const updates = c.get("validatedData");

  const boardService = createBoardService(db, c.get("eventService"));
  const board = await boardService.update(userId, boardId, updates);

  return c.json(board);
});

// PATCH /boards/:boardID/default-view
boardRoutes.patch("/boards/:boardID/default-view", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;
  const body = await c.req.json();
  const {defaultViewId} = body;

  // Validate view exists and is team/template (not personal)
  if (defaultViewId) {
    const view = db
      .select()
      .from(blocks)
      .where(and(eq(blocks.id, defaultViewId), eq(blocks.type, 'view')))
      .get();

    if (!view) {
      return c.json({error: 'Invalid view ID'}, 400);
    }

    const viewFields = view.fields as any;
    const visibility = viewFields?.visibility || 'team';

    if (visibility === 'personal') {
      return c.json({error: 'Cannot set personal view as board default'}, 400);
    }
  }

  const boardService = createBoardService(db, c.get("eventService"));
  const board = await boardService.update(userId, boardId, {defaultViewId});

  return c.json(board);
});

// DELETE /boards/:boardID
boardRoutes.delete("/boards/:boardID", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  await boardService.delete(userId, boardId);

  return c.json({}, 200);
});

// POST /boards/:boardID/duplicate
boardRoutes.post("/boards/:boardID/duplicate", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  const board = await boardService.duplicate(userId, boardId);

  return c.json(board);
});

// POST /boards/:boardID/undelete
boardRoutes.post("/boards/:boardID/undelete", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  const board = await boardService.undelete(userId, boardId);

  return c.json(board);
});

// POST /boards/:boardID/toggle-favorite
boardRoutes.post("/boards/:boardID/toggle-favorite", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  const isFavorite = await boardService.toggleFavorite(userId, boardId);

  return c.json({isFavorite});
});

// GET /boards/:boardID/metadata
boardRoutes.get("/boards/:boardID/metadata", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  const boardService = createBoardService(db, c.get("eventService"));
  const board = boardService.getByIdOrFail(boardId, userId);

  // Count blocks
  const blockRepo = createBlockRepository(db);
  const boardBlocks = blockRepo.findByBoard(boardId);

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
