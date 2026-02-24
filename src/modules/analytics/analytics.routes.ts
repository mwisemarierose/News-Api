import { Router } from "express";
import { authenticate, requireRole } from "../../middleware/auth";
import { validateQuery } from "../../middleware/validate";
import { dashboardQuerySchema } from "../articles/article.validator";
import { dashboardHandler } from "./analytics.controller";

const router = Router();

/**
 * GET /author/dashboard
 * US7: Author performance dashboard with TotalViews per article
 */
router.get(
    "/dashboard",
    authenticate,
    requireRole("author"),
    validateQuery(dashboardQuerySchema),
    dashboardHandler
);

export default router;
