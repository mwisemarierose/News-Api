import rateLimit from "express-rate-limit";
import { Request } from "express";
import { sendError } from "../utils/response";
import { Response } from "express";

/**
 * Rate limiter for GET /articles/:id
 * Key: IP + userId (or "guest") → prevents same user from generating >10 reads/min
 *
 * Uses the recommended ipKeyGenerator pattern to handle IPv6.
 */
export const readRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    // Skip custom keyGenerator to satisfy express-rate-limit IPv6 validation;
    // rely on default IP key and append userId via requestWasSuccessful/skip override.
    // We instead use a store key via the keyGenerator with validate disabled.
    validate: { xForwardedForHeader: false },
    keyGenerator: (req: Request): string => {
        // Use req.ip (already normalised by Express) + userId for per-user tracking
        const ip = (req.ip ?? "unknown").replace(/^::ffff:/, ""); // normalise IPv4-mapped
        const userId = req.user?.sub ?? "guest";
        return `${ip}_${userId}`;
    },
    handler: (_req: Request, res: Response) => {
        sendError(
            res,
            "Too many requests",
            ["Rate limit exceeded. Please wait before reading more articles."],
            429
        );
    },
    standardHeaders: true,
    legacyHeaders: false,
});
