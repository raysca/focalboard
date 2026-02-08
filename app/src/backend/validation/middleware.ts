import type { Context, Next } from "hono"
import type { ZodSchema, ZodError } from "zod"
import { BadRequestError } from "../errors.ts"

/**
 * Validation middleware factory for Hono routes
 * Validates request body against a Zod schema and attaches validated data to context
 *
 * @example
 * boardRoutes.post("/boards", sessionRequired, validateRequest(createBoardSchema), async (c) => {
 *   const data = c.get("validatedData")
 *   // data is type-safe and validated
 * })
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const body = await c.req.json()
            const validatedData = schema.parse(body)
            c.set("validatedData", validatedData)
            await next()
        } catch (error) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error)
                throw new BadRequestError(`Validation failed: ${errors}`)
            }
            throw error
        }
    }
}

/**
 * Validation middleware for query parameters
 *
 * @example
 * boardRoutes.get("/search", validateQuery(searchBoardsSchema), async (c) => {
 *   const query = c.get("validatedQuery")
 * })
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const query = c.req.query()
            const validatedQuery = schema.parse(query)
            c.set("validatedQuery", validatedQuery)
            await next()
        } catch (error) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error)
                throw new BadRequestError(`Query validation failed: ${errors}`)
            }
            throw error
        }
    }
}

/**
 * Validation middleware for route parameters
 *
 * @example
 * boardRoutes.get("/boards/:boardID", validateParams(z.object({ boardID: z.string().uuid() })), async (c) => {
 *   const params = c.get("validatedParams")
 * })
 */
export function validateParams<T>(schema: ZodSchema<T>) {
    return async (c: Context, next: Next) => {
        try {
            const params = c.req.param()
            const validatedParams = schema.parse(params)
            c.set("validatedParams", validatedParams)
            await next()
        } catch (error) {
            if (isZodError(error)) {
                const errors = formatZodErrors(error)
                throw new BadRequestError(`Parameter validation failed: ${errors}`)
            }
            throw error
        }
    }
}

/**
 * Type guard to check if error is a ZodError
 */
function isZodError(error: unknown): error is ZodError {
    return (
        typeof error === "object" &&
        error !== null &&
        "issues" in error &&
        Array.isArray((error as any).issues)
    )
}

/**
 * Format Zod validation errors into a readable string
 */
function formatZodErrors(error: ZodError): string {
    return error.issues
        .map((issue) => {
            const path = issue.path.join(".")
            return path ? `${path}: ${issue.message}` : issue.message
        })
        .join(", ")
}

/**
 * Extract validated data from context (helper for type safety)
 */
export function getValidatedData<T>(c: Context): T {
    return c.get("validatedData") as T
}

/**
 * Extract validated query from context (helper for type safety)
 */
export function getValidatedQuery<T>(c: Context): T {
    return c.get("validatedQuery") as T
}

/**
 * Extract validated params from context (helper for type safety)
 */
export function getValidatedParams<T>(c: Context): T {
    return c.get("validatedParams") as T
}
