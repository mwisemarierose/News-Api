import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { swaggerSpec } from "./config/swagger";
import authRoutes from "./modules/auth/auth.routes";
import articleRoutes from "./modules/articles/article.routes";
import analyticsRoutes from "./modules/analytics/analytics.routes";
import { errorHandler } from "./middleware/errorHandler";
import { sendError } from "./utils/response";

const app = express();

// ─── Security & Parsing Middleware ────────────────────────────────────────────
app.use(
    helmet({
        // Allow Swagger UI inline scripts/styles
        contentSecurityPolicy: false,
    })
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Request Logging (skip in tests) ─────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
    app.use(morgan("dev"));
}

// ─── Swagger UI ───────────────────────────────────────────────────────────────
app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
        customSiteTitle: "News API Docs",
        swaggerOptions: {
            persistAuthorization: true, // JWT stays after page refresh
            docExpansion: "list",
            filter: true,
            displayRequestDuration: true,
        },
        customCss: `
      .topbar { background-color: #1a1a2e !important; }
      .topbar .link { color: #e94560 !important; }
      .swagger-ui .info .title { color: #1a1a2e; }
    `,
    })
);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/auth", authRoutes);
app.use("/articles", articleRoutes);
app.use("/author", analyticsRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
    sendError(res, "Route not found", [], 404);
});

// ─── Global Error Handler ────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
