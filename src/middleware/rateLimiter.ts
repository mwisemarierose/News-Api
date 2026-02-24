import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { Request, Response } from "express";
import { sendError } from "../utils/response";

/**
 * Rate limiter for GET /articles/:id
 * Key: IP + userId (or "guest") → prevents same user from generating >10 reads/min
 *
 * Uses ipKeyGenerator to properly handle IPv4/IPv6 normalisation as required
 * by express-rate-limit v7.
 */
export const readRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    keyGenerator: (req: Request): string => {
        const baseIp = ipKeyGenerator(req); // Safe IPv4/IPv6 normalised key
        const userId = req.user?.sub ?? "guest";
        return `${baseIp}_${userId}`;
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
