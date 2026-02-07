import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";
import { BadRequestError, NotFoundError } from "../errors.ts";

const contentBlockRoutes = new Hono();

// POST /content-blocks/:blockID/moveto/:where/:dstBlockID
contentBlockRoutes.post(
  "/content-blocks/:blockID/moveto/:where/:dstBlockID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const where = c.req.param("where");
    const dstBlockId = c.req.param("dstBlockID");
    const userId = c.get("userId") as string;
    const now = Date.now();

    const block = db.select().from(blocks).where(eq(blocks.id, blockId)).get();
    if (!block) throw new NotFoundError("block not found");

    const dstBlock = db
      .select()
      .from(blocks)
      .where(eq(blocks.id, dstBlockId))
      .get();
    if (!dstBlock) throw new NotFoundError("destination block not found");

    // Update the block's parent to match the destination's parent
    db.update(blocks)
      .set({
        parentId: where === "after" ? dstBlock.parentId : dstBlockId,
        modifiedBy: userId,
        updateAt: now,
      })
      .where(eq(blocks.id, blockId))
      .run();

    return c.json({}, 200);
  },
);

export default contentBlockRoutes;
