import { Hono } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import { subscriptions } from "../db/schema.ts";
import { sessionRequired } from "../middleware/auth.ts";
import { eq, and } from "drizzle-orm";

const subscriptionRoutes = new Hono();

// POST /subscriptions
subscriptionRoutes.post("/subscriptions", sessionRequired, async (c) => {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const body = await c.req.json();
  const now = Date.now();

  const sub = {
    blockType: body.blockType ?? "",
    blockId: body.blockId ?? "",
    subscriberType: body.subscriberType ?? "",
    subscriberId: body.subscriberId ?? "",
    notifiedAt: 0,
    createAt: now,
    deleteAt: 0,
  };

  db.insert(subscriptions).values(sub).run();

  return c.json(sub);
});

// DELETE /subscriptions/:blockID/:subscriberID
subscriptionRoutes.delete(
  "/subscriptions/:blockID/:subscriberID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const blockId = c.req.param("blockID");
    const subscriberId = c.req.param("subscriberID");

    db.update(subscriptions)
      .set({ deleteAt: Date.now() })
      .where(
        and(
          eq(subscriptions.blockId, blockId),
          eq(subscriptions.subscriberId, subscriberId),
        ),
      )
      .run();

    return c.json({}, 200);
  },
);

// GET /subscriptions/:subscriberID
subscriptionRoutes.get(
  "/subscriptions/:subscriberID",
  sessionRequired,
  async (c) => {
    const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
    const subscriberId = c.req.param("subscriberID");

    const subs = db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.subscriberId, subscriberId),
          eq(subscriptions.deleteAt, 0),
        ),
      )
      .all();

    return c.json(subs);
  },
);

export default subscriptionRoutes;
