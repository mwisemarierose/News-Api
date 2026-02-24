import { Worker, Job } from "bullmq";
import { ANALYTICS_QUEUE_NAME, redisConnection } from "./analyticsQueue";
import prisma from "../config/prisma";

interface AggregateJobData {
    date: string; // YYYY-MM-DD in UTC/GMT
}

/**
 * Aggregates ReadLog entries into DailyAnalytics.
 * Groups all reads by (articleId, date) in GMT, then upserts into DailyAnalytics.
 */
export async function processAnalytics(job: Job<AggregateJobData>): Promise<void> {
    const { date } = job.data;

    if (process.env.NODE_ENV !== "test") {
        console.log(`[Analytics] Processing reads for date: ${date}`);
    }

    // Parse the target day boundaries in UTC
    const dayStart = new Date(`${date}T00:00:00.000Z`);
    const dayEnd = new Date(`${date}T23:59:59.999Z`);

    // Fetch all read logs for that UTC day
    const logs = await prisma.readLog.findMany({
        where: {
            readAt: { gte: dayStart, lte: dayEnd },
        },
        select: { articleId: true },
    });

    if (logs.length === 0) {
        if (process.env.NODE_ENV !== "test") {
            console.log(`[Analytics] No reads found for ${date}`);
        }
        return;
    }

    // Aggregate counts per article
    const counts = new Map<string, number>();
    for (const log of logs) {
        counts.set(log.articleId, (counts.get(log.articleId) ?? 0) + 1);
    }

    // Upsert each aggregated count
    const analyticsDate = new Date(`${date}T00:00:00.000Z`);

    await prisma.$transaction(
        Array.from(counts.entries()).map(([articleId, viewCount]) =>
            prisma.dailyAnalytics.upsert({
                where: {
                    articleId_date: {
                        articleId,
                        date: analyticsDate,
                    },
                },
                update: { viewCount },
                create: { articleId, viewCount, date: analyticsDate },
            })
        )
    );

    if (process.env.NODE_ENV !== "test") {
        console.log(
            `[Analytics] Done — upserted ${counts.size} article(s) for ${date}`
        );
    }
}

export function startAnalyticsWorker(): Worker {
    const worker = new Worker<AggregateJobData>(
        ANALYTICS_QUEUE_NAME,
        processAnalytics,
        { connection: redisConnection, concurrency: 1 }
    );

    worker.on("completed", (job) => {
        if (process.env.NODE_ENV !== "test") {
            console.log(`[Analytics] Job ${job.id} completed`);
        }
    });

    worker.on("failed", (job, err) => {
        if (process.env.NODE_ENV !== "test") {
            console.error(`[Analytics] Job ${job?.id} failed:`, err.message);
        }
    });

    return worker;
}
