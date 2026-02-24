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
        Object.assign(req.query, result.data);
        next();
    };
}
