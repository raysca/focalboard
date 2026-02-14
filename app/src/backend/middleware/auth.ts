import type { Context, Next } from "hono";
import type { BunSQLiteDatabase } from "drizzle-orm/bun-sqlite";
import type * as schemaType from "../db/schema.ts";
import type { Auth } from "../auth/index.ts";
import { UnauthorizedError, ForbiddenError } from "../errors.ts";
import { userProfiles } from "../db/schema.ts";
import { eq } from "drizzle-orm";

type SessionResult = {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
  };
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
  };
} | null;

/**
 * Requires a valid session. Returns 401 if not authenticated.
 * Sets c.set("userId", ...) and c.set("session", ...) on success.
 */
export async function sessionRequired(c: Context, next: Next) {
  const auth = c.get("auth") as Auth;
  const result = (await auth.api.getSession({
    headers: c.req.raw.headers,
  })) as SessionResult;

  if (!result) {
    throw new UnauthorizedError();
  }
  c.set("userId", result.user.id);
  c.set("session", result.session);
  c.set("user", result.user);
  await next();
}

/**
 * Optionally attaches session if present, but does NOT require it.
 */
export async function attachSession(c: Context, next: Next) {
  const auth = c.get("auth") as Auth;
  const result = (await auth.api.getSession({
    headers: c.req.raw.headers,
  })) as SessionResult;

  if (result) {
    c.set("userId", result.user.id);
    c.set("session", result.session);
    c.set("user", result.user);
  }
  await next();
}

/**
 * Requires admin role. Returns 403 if user is not an admin.
 * Must be used after sessionRequired middleware.
 */
export async function adminRequired(c: Context, next: Next) {
  const db = c.get("db") as BunSQLiteDatabase<typeof schemaType>;
  const userId = c.get("userId") as string;

  const profile = db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .get();

  if (!profile?.roles?.includes("admin")) {
    throw new ForbiddenError("admin access required");
  }

  await next();
}
