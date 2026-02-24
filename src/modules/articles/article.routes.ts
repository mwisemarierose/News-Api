import { Router } from "express";
import { authenticate, optionalAuthenticate, requireRole } from "../../middleware/auth";
import { validate, validateQuery } from "../../middleware/validate";
import {
    createArticleSchema,
    updateArticleSchema,
    articleQuerySchema,
    myArticlesQuerySchema,
} from "./article.validator";
import { readRateLimiter } from "../../middleware/rateLimiter";
import {
    createArticleHandler,
    getMyArticlesHandler,
    updateArticleHandler,
    deleteArticleHandler,
    getPublishedArticlesHandler,
    getArticleByIdHandler,
} from "./article.controller";

const router = Router();

// ─── Author-only (MUST come before /:id to avoid route shadowing) ─────────────

/**
 * GET /articles/me
 * US8: Author's own articles (draft + published, optional deleted)
 */
router.get(
    "/me",
    authenticate,
    requireRole("author"),
    validateQuery(myArticlesQuerySchema),
    getMyArticlesHandler
);

/**
 * POST /articles
 * US3: Create a new article
 */
router.post(
    "/",
    authenticate,
    requireRole("author"),
    validate(createArticleSchema),
    createArticleHandler
);

/**
 * PUT /articles/:id
 * US3: Edit own article
 */
router.put(
    "/:id",
    authenticate,
    requireRole("author"),
    validate(updateArticleSchema),
    updateArticleHandler
);

/**
 * DELETE /articles/:id
 * US3: Soft-delete own article
 */
router.delete("/:id", authenticate, requireRole("author"), deleteArticleHandler);

// ─── Public endpoints (/:id MUST be last — it's a catch-all param) ───────────

/**
 * GET /articles
 * US4: Public news feed — published + not deleted, filterable, paginated
 */
router.get(
    "/",
    validateQuery(articleQuerySchema),
    getPublishedArticlesHandler
);

/**
 * GET /articles/:id
 * US5: Article detail — optionally authenticated, triggers read log
 */
router.get(
    "/:id",
    optionalAuthenticate,
    readRateLimiter,
    getArticleByIdHandler
);

export default router;
