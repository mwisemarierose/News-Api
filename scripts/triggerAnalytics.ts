/**
 * Manual Analytics Trigger Script for testing
 * Run this to manually trigger the analytics aggregation job for a specific
 * date (or today by default). This populates DailyAnalytics from ReadLog so
 * the author dashboard shows real TotalViews without waiting for the nightly cron.
 *
 * Usage:
 *   npx ts-node scripts/triggerAnalytics.ts             # aggregates TODAY (UTC)
 *   npx ts-node scripts/triggerAnalytics.ts 2026-02-24  # aggregates a specific date
 */

import "dotenv/config";
import { processAnalytics } from "../src/jobs/analyticsWorker";
import prisma from "../src/config/prisma";

async function main() {
    const dateArg = process.argv[2];

    // Default to today in UTC (GMT)
    const date = dateArg ?? new Date().toISOString().split("T")[0];

    // Validate format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        console.error(`❌ Invalid date format: "${date}". Expected YYYY-MM-DD.`);
        process.exit(1);
    }

    console.log(`\n🔄 Running analytics aggregation for date: ${date} (GMT)\n`);

    await processAnalytics({ data: { date } } as any);

    console.log(`\n✅ Done. Check DailyAnalytics in your database or hit GET /author/dashboard.\n`);
    await prisma.$disconnect();
}

main().catch((err) => {
    console.error("❌ Script failed:", err);
    prisma.$disconnect();
    process.exit(1);
});
