import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { blocks } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq } from "drizzle-orm";
import { NotFoundError } from "../errors.ts";
import type { BlockService } from "../services/block.ts";

const contentBlockRoutes = new Hono();

// POST /content-blocks/:blockID/moveto/:where/:dstBlockID
contentBlockRoutes.post(
  "/content-blocks/:blockID/moveto/:where/:dstBlockID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockService = c.get("blockService") as BlockService;
    const blockId = c.req.param("blockID");
    const where = c.req.param("where");
    const dstBlockId = c.req.param("dstBlockID");
    const userId = c.get("userId") as string;

    // Get destination block to determine new parent
    const dstBlock = db
      .select()
      .from(blocks)
      .where(eq(blocks.id, dstBlockId))
      .get();
    if (!dstBlock) throw new NotFoundError("destination block not found");

    // Determine new parent based on 'where' parameter
    const newParentId = where === "after" ? dstBlock.parentId : dstBlockId;
    if (!newParentId) throw new NotFoundError("destination parent not found");

    // Use BlockService.move() which handles authorization and publishes events
    await blockService.move(userId, blockId, newParentId);

    return c.json({}, 200);
  },
);

export default contentBlockRoutes;
