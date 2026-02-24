import cron from "node-cron";
import { enqueueAnalyticsJob } from "./analyticsQueue";

/**
 * Schedules the analytics aggregation job daily at 00:01 UTC.
 * The job aggregates the previous day's ReadLog entries into DailyAnalytics.
 */
export function startAnalyticsScheduler(): void {
    // Runs every day at 00:01 UTC (timezone: UTC)
    cron.schedule(
        "1 0 * * *",
        async () => {
            // The job aggregates the PREVIOUS day
            const yesterday = new Date();
            yesterday.setUTCDate(yesterday.getUTCDate() - 1);
            const dateStr = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD

            try {
                await enqueueAnalyticsJob(dateStr);
                console.log(`[Scheduler] Enqueued analytics job for ${dateStr}`);
            } catch (err) {
                console.error("[Scheduler] Failed to enqueue analytics job:", err);
            }
        },
        { timezone: "UTC" }
    );

    console.log("[Scheduler] Analytics scheduler started — runs daily at 00:01 UTC");
}
