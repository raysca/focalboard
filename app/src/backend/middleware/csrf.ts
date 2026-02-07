import type { Context, Next } from "hono";
import { BadRequestError } from "../errors.ts";

const HEADER_REQUESTED_WITH = "X-Requested-With";
const HEADER_REQUESTED_WITH_XML = "XMLHttpRequest";

export async function csrfCheck(c: Context, next: Next) {
  const token = c.req.header(HEADER_REQUESTED_WITH);
  if (token !== HEADER_REQUESTED_WITH_XML) {
    throw new BadRequestError("checkCSRFToken FAILED");
  }
  await next();
}
