import Redis from "ioredis";

const redisOptions = {
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
};

export const redis = new Redis(redisOptions);
export const redisOptions_ = redisOptions;
