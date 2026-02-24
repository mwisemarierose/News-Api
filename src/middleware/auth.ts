import { Request, Response, NextFunction } from "express";
import { verifyToken, JwtPayload } from "../utils/jwt";
import { sendError } from "../utils/response";

// Extend Express Request with user context
declare global {
    namespace Express {
        interface Request {
            user?: JwtPayload;
        }
    }
}

/**
 * Require valid JWT. Rejects unauthenticated requests.
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
        sendError(res, "Unauthorized", ["No token provided"], 401);
        return;
    }
    const token = authHeader.split(" ")[1];
    try {
        req.user = verifyToken(token);
        next();
    } catch {
        sendError(res, "Unauthorized", ["Invalid or expired token"], 401);
    }
}

/**
 * Optionally parse JWT if present; does NOT reject unauthenticated requests.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction): void {
    console.log("Authorization header:", req.headers.authorization);
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        try {
            req.user = verifyToken(token);
        } catch {
            console.warn("Invalid token in optionalAuthenticate:", token);
        }
    }
    next();
}

/**
 * RBAC guard — only allows users with the specified role.
 */
export function requireRole(role: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            sendError(res, "Unauthorized", ["Authentication required"], 401);
            return;
        }
        if (req.user.role !== role) {
            sendError(res, "Forbidden", [`Only ${role}s can access this endpoint`], 403);
            return;
        }
        next();
    };
}
