import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks, boards, boardMembers } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { NotFoundError, BadRequestError, ForbiddenError } from "../errors.ts";
import { FileService } from "../services/file.ts";

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

// Helper function to verify board access
async function verifyBoardAccess(
  db: BunSQLiteDatabase<typeof schemaType>,
  cardId: string,
  userId: string
) {
  const card = db
    .select()
    .from(blocks)
    .where(eq(blocks.id, cardId))
    .get();

  if (!card) {
    throw new NotFoundError("Card not found");
  }

  const member = db
    .select()
    .from(boardMembers)
    .where(
      and(
        eq(boardMembers.boardId, card.boardId),
        eq(boardMembers.userId, userId)
      )
    )
    .get();

  if (!member) {
    throw new ForbiddenError("Access denied");
  }

  return { card, member };
}

// POST /cards/:cardID/attachments
cardRoutes.post("/cards/:cardID/attachments", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const cardId = c.req.param("cardID");
  const userId = c.get("userId") as string;

  // Verify access
  const { card } = await verifyBoardAccess(db, cardId, userId);

  // Get board to extract teamId
  const board = db
    .select()
    .from(boards)
    .where(eq(boards.id, card.boardId))
    .get();

  if (!board) {
    throw new NotFoundError("Board not found");
  }

  const formData = await c.req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new BadRequestError("file is required");
  }

  const fileService = new FileService(db);
  const attachment = await fileService.uploadCardAttachment({
    file,
    cardId,
    userId,
    teamId: board.teamId,
    boardId: card.boardId,
  });

  return c.json(attachment, 201);
});

// GET /cards/:cardID/attachments
cardRoutes.get("/cards/:cardID/attachments", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const cardId = c.req.param("cardID");
  const userId = c.get("userId") as string;

  // Verify access
  await verifyBoardAccess(db, cardId, userId);

  const fileService = new FileService(db);
  const attachments = await fileService.getCardAttachments(cardId);

  return c.json(attachments);
});

// DELETE /cards/:cardID/attachments/:attachmentID
cardRoutes.delete(
  "/cards/:cardID/attachments/:attachmentID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const cardId = c.req.param("cardID");
    const attachmentId = c.req.param("attachmentID");
    const userId = c.get("userId") as string;

    // Verify access
    await verifyBoardAccess(db, cardId, userId);

    const fileService = new FileService(db);
    const result = await fileService.deleteAttachment(attachmentId, cardId);

    return c.json(result);
  }
);

// GET /cards/:cardID/attachments/:attachmentID/download
cardRoutes.get(
  "/cards/:cardID/attachments/:attachmentID/download",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const cardId = c.req.param("cardID");
    const attachmentId = c.req.param("attachmentID");
    const userId = c.get("userId") as string;

    // Verify access
    await verifyBoardAccess(db, cardId, userId);

    const fileService = new FileService(db);
    const { filePath, filename, mimeType } =
      await fileService.getAttachmentFile(attachmentId);

    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      throw new NotFoundError("File not found");
    }

    return new Response(file.stream(), {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }
);

export default cardRoutes;
