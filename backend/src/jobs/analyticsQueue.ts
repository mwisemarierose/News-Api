import { Queue } from "bullmq";

// Inline connection options to avoid circular imports with the Redis singleton
const redisConnection = {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
};

export const ANALYTICS_QUEUE_NAME = "analytics";

export const analyticsQueue = new Queue(ANALYTICS_QUEUE_NAME, {
    connection: redisConnection,
    defaultJobOptions: {
        removeOnComplete: 100,
        removeOnFail: 50,
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
    },
});

/**
 * Enqueue a daily analytics aggregation job.
 * The date parameter (YYYY-MM-DD) is the day to aggregate in GMT/UTC.
 */
export async function enqueueAnalyticsJob(date: string): Promise<void> {
    await analyticsQueue.add(
        "aggregate-reads",
        { date },
        { jobId: `aggregate-reads-${date}` } // deduplicate by date
    );
}

export { redisConnection };
