import type { Context } from "hono";
import type { StatusCode } from "hono/utils/http-status";
import { AppError } from "../errors.ts";

export function onError(err: Error, c: Context) {
  if (err instanceof AppError) {
    return c.json(
      { error: err.message, errorCode: err.statusCode },
      err.statusCode as StatusCode,
    );
  }

  console.error("API ERROR", err);
  return c.json({ error: "internal server error", errorCode: 500 }, 500);
}
