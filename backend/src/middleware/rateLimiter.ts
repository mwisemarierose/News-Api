import rateLimit from "express-rate-limit";
import { Request, Response } from "express";
import { sendError } from "../utils/response";

/**
 * Rate limiter for GET /articles/:id
 * Key: IP + userId (or "guest") → prevents same user from generating >10 reads/min
 *
 * Normalises IPv4-mapped IPv6 (::ffff:x.x.x.x) so the rate limit key is stable.
 */
function normaliseIp(raw: string | undefined): string {
    if (!raw) return "unknown";
    // Strip IPv4-mapped IPv6 prefix e.g. "::ffff:127.0.0.1" → "127.0.0.1"
    return raw.replace(/^::ffff:/i, "");
}

export const readRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute window
    max: 10,             // max 10 reads per window per key
    keyGenerator: (req: Request): string => {
        const ip = normaliseIp(req.ip);
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
    // Disable the IPv6 keyGenerator validation (we handle normalisation manually)
    validate: { xForwardedForHeader: false, ip: false },
});
