import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { fileInfo } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";
import { config } from "../config.ts";
import { NotFoundError, BadRequestError } from "../errors.ts";
import { join, extname } from "path";
import { mkdir } from "fs/promises";

const fileRoutes = new Hono();

// POST /teams/:teamID/:boardID/files
fileRoutes.post(
  "/teams/:teamID/:boardID/files",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const teamId = c.req.param("teamID");
    const boardId = c.req.param("boardID");
    const now = Date.now();

    const formData = await c.req.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new BadRequestError("file is required");
    }

    const id = crypto.randomUUID();
    const ext = extname(file.name);
    const filename = `${id}${ext}`;
    const dirPath = join(config.filespath, teamId, boardId);
    const filePath = join(dirPath, filename);

    // Ensure directory exists
    await mkdir(dirPath, { recursive: true });

    // Write file
    const buffer = await file.arrayBuffer();
    await Bun.write(filePath, buffer);

    // Save file info
    db.insert(fileInfo)
      .values({
        id,
        createAt: now,
        deleteAt: 0,
        name: file.name,
        extension: ext,
        size: file.size,
        archived: false,
        path: filePath,
      })
      .run();

    return c.json({ fileId: id });
  },
);

// GET /files/teams/:teamID/:boardID/:filename
fileRoutes.get(
  "/files/teams/:teamID/:boardID/:filename",
  async (c) => {
    const teamId = c.req.param("teamID");
    const boardId = c.req.param("boardID");
    const filename = c.req.param("filename");

    const filePath = join(config.filespath, teamId, boardId, filename);
    const file = Bun.file(filePath);

    if (!(await file.exists())) {
      throw new NotFoundError("file not found");
    }

    return new Response(file);
  },
);

// GET /files/teams/:teamID/:boardID/:filename/info
fileRoutes.get(
  "/files/teams/:teamID/:boardID/:filename/info",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const filename = c.req.param("filename");

    // Extract ID from filename (strip extension)
    const id = filename.split(".")[0]!;

    const info = db
      .select()
      .from(fileInfo)
      .where(eq(fileInfo.id, id))
      .get();

    if (!info) throw new NotFoundError("file info not found");

    return c.json(info);
  },
);

export default fileRoutes;
