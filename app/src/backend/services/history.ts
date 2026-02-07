import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import {
  blocks,
  blocksHistory,
  boards,
  boardsHistory,
  boardMembersHistory,
} from "../db/schema.ts";
import { eq } from "drizzle-orm";

type DB = BunSQLiteDatabase<typeof schemaType>;

export function recordBlockHistory(db: DB, blockId: string) {
  const block = db.select().from(blocks).where(eq(blocks.id, blockId)).get();
  if (!block) return;

  db.insert(blocksHistory)
    .values({
      ...block,
      insertAt: Date.now(),
    })
    .run();
}

export function recordBoardHistory(db: DB, boardId: string) {
  const board = db.select().from(boards).where(eq(boards.id, boardId)).get();
  if (!board) return;

  db.insert(boardsHistory)
    .values({
      ...board,
      insertAt: Date.now(),
    })
    .run();
}

export function recordMemberHistory(
  db: DB,
  boardId: string,
  userId: string,
  action: string,
) {
  db.insert(boardMembersHistory)
    .values({
      boardId,
      userId,
      action,
      insertAt: Date.now(),
    })
    .run();
}
