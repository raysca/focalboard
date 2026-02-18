import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { boardMembers, boards } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { BadRequestError, ForbiddenError, NotFoundError } from "../errors.ts";
import { recordMemberHistory } from "../services/history.ts";

const memberRoutes = new Hono();

function getCallerMember(db: BunSQLiteDatabase<typeof schemaType>, boardId: string, callerId: string) {
  return db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, callerId)))
    .get();
}

function requireBoardAdmin(db: BunSQLiteDatabase<typeof schemaType>, boardId: string, callerId: string) {
  const callerMember = getCallerMember(db, boardId, callerId);
  if (!callerMember?.schemeAdmin) {
    throw new ForbiddenError("must be board admin");
  }
}

function countAdmins(db: BunSQLiteDatabase<typeof schemaType>, boardId: string): number {
  return db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.schemeAdmin, true)))
    .all().length;
}

// GET /boards/:boardID/members
memberRoutes.get("/boards/:boardID/members", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");

  const members = db
    .select()
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId))
    .all();

  return c.json(members);
});

// POST /boards/:boardID/members
memberRoutes.post("/boards/:boardID/members", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const callerId = c.get("userId") as string;
  const body = await c.req.json();

  requireBoardAdmin(db, boardId, callerId);

  // Check for duplicate member
  const existing = db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, body.userId)))
    .get();
  if (existing) {
    throw new BadRequestError("user is already a member of this board");
  }

  const member = {
    boardId,
    userId: body.userId,
    roles: body.roles ?? "",
    minimumRole: body.minimumRole ?? "",
    schemeAdmin: body.schemeAdmin ?? false,
    schemeEditor: body.schemeEditor ?? false,
    schemeCommenter: body.schemeCommenter ?? false,
    schemeViewer: body.schemeViewer ?? true,
  };

  db.insert(boardMembers).values(member).run();
  recordMemberHistory(db, boardId, body.userId, "add");

  return c.json(member);
});

// PUT /boards/:boardID/members/:userID
memberRoutes.put(
  "/boards/:boardID/members/:userID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const boardId = c.req.param("boardID");
    const userId = c.req.param("userID");
    const callerId = c.get("userId") as string;
    const body = await c.req.json();

    requireBoardAdmin(db, boardId, callerId);

    const updates: Record<string, unknown> = {};
    if (body.roles !== undefined) updates.roles = body.roles;
    if (body.schemeAdmin !== undefined) updates.schemeAdmin = body.schemeAdmin;
    if (body.schemeEditor !== undefined) updates.schemeEditor = body.schemeEditor;
    if (body.schemeCommenter !== undefined)
      updates.schemeCommenter = body.schemeCommenter;
    if (body.schemeViewer !== undefined) updates.schemeViewer = body.schemeViewer;

    db.update(boardMembers)
      .set(updates)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, userId),
        ),
      )
      .run();
    recordMemberHistory(db, boardId, userId, "update");

    const updated = db
      .select()
      .from(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, userId),
        ),
      )
      .get();

    return c.json(updated);
  },
);

// DELETE /boards/:boardID/members/:userID
memberRoutes.delete(
  "/boards/:boardID/members/:userID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const boardId = c.req.param("boardID");
    const userId = c.req.param("userID");
    const callerId = c.get("userId") as string;

    requireBoardAdmin(db, boardId, callerId);

    // Protect last admin: if target is admin and would be the last one, block removal
    const targetMember = db
      .select()
      .from(boardMembers)
      .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)))
      .get();

    if (targetMember?.schemeAdmin && countAdmins(db, boardId) <= 1) {
      throw new BadRequestError("cannot remove the last admin from the board");
    }

    recordMemberHistory(db, boardId, userId, "delete");
    db.delete(boardMembers)
      .where(
        and(
          eq(boardMembers.boardId, boardId),
          eq(boardMembers.userId, userId),
        ),
      )
      .run();

    return c.json({}, 200);
  },
);

// POST /boards/:boardID/join
memberRoutes.post("/boards/:boardID/join", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  // Check if board is open
  const board = db.select().from(boards).where(eq(boards.id, boardId)).get();
  if (!board) throw new NotFoundError("board not found");
  if (board.type !== "O") throw new ForbiddenError("board is not open");

  // Check if already a member
  const existing = db
    .select()
    .from(boardMembers)
    .where(
      and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    )
    .get();

  if (!existing) {
    db.insert(boardMembers)
      .values({
        boardId,
        userId,
        roles: "",
        minimumRole: "",
        schemeAdmin: false,
        schemeEditor: true,
        schemeCommenter: true,
        schemeViewer: true,
      })
      .run();
    recordMemberHistory(db, boardId, userId, "join");
  }

  const member = db
    .select()
    .from(boardMembers)
    .where(
      and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    )
    .get();

  return c.json(member);
});

// POST /boards/:boardID/leave
memberRoutes.post("/boards/:boardID/leave", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const boardId = c.req.param("boardID");
  const userId = c.get("userId") as string;

  recordMemberHistory(db, boardId, userId, "leave");
  db.delete(boardMembers)
    .where(
      and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)),
    )
    .run();

  return c.json({}, 200);
});

export default memberRoutes;
