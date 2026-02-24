import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils/response";

export class AppError extends Error {
    constructor(
        public message: string,
        public statusCode: number = 500,
        public errors: string[] = []
    ) {
        super(message);
        this.name = "AppError";
    }
}

/**
 * Global error handler — never leaks stack traces to clients.
 */
export function errorHandler(
    err: Error,
    _req: Request,
    res: Response,
    _next: NextFunction
): void {
    if (err instanceof AppError) {
        sendError(res, err.message, err.errors, err.statusCode);
        return;
    }

    // Log server errors internally
    if (process.env.NODE_ENV !== "test") {
        console.error("[ERROR]", err.message);
    }

    sendError(res, "Internal server error", [], 500);
}
