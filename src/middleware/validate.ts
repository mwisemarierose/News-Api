import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { sendError } from "../utils/response";

/**
 * Centralized Zod validation middleware.
 * Validates req.body against the given schema.
 */
export function validate(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const errors = result.error.issues.map(
                (e) => `${e.path.join(".")}: ${e.message}`
            );
            sendError(res, "Validation failed", errors, 422);
            return;
        }
        req.body = result.data;
        next();
    };
}

/**
 * Validates query parameters against the given schema.
 */
export function validateQuery(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction): void => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const errors = result.error.issues.map(
                (e) => `${e.path.join(".")}: ${e.message}`
            );
            sendError(res, "Query validation failed", errors, 422);
            return;
        }
        // In Express 5, `req.query` is a read-only property on the Request object,
        // so we cannot reassign it. Instead, we merge the validated values into
        // the existing query object.
        Object.assign(req.query, result.data);
        next();
    };
}
