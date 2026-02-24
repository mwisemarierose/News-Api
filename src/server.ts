import "dotenv/config";
import app from "./app";
import { startAnalyticsWorker } from "./jobs/analyticsWorker";
import { startAnalyticsScheduler } from "./jobs/analyticsScheduler";
import prisma from "./config/prisma";

const PORT = Number(process.env.PORT ?? 3000);

async function bootstrap() {
    try {
        // Verify DB connection
        await prisma.$connect();
        console.log("[DB] Connected to database");

        // Start BullMQ worker
        startAnalyticsWorker();
        console.log("[Worker] Analytics worker started");

        // Start daily cron scheduler
        startAnalyticsScheduler();

        // Start HTTP server
        app.listen(PORT, () => {
            console.log(`[Server] Running on http://localhost:${PORT}`);
            console.log(`[Server] Environment: ${process.env.NODE_ENV ?? "development"}`);
        });
    } catch (err) {
        console.error("[Server] Failed to start:", err);
        await prisma.$disconnect();
        process.exit(1);
    }
}

bootstrap();
