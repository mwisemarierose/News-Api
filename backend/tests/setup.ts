import "dotenv/config";

// Set test environment
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key-for-jest";
process.env.JWT_EXPIRES_IN = "1h";
process.env.REDIS_HOST = "localhost";
process.env.REDIS_PORT = "6379";

// Mock Prisma to avoid real DB calls
jest.mock("../src/config/prisma", () => {
    const { mockDeep, mockReset } = require("jest-mock-extended");
    const prismaMock = mockDeep();
    beforeEach(() => mockReset(prismaMock));
    return { __esModule: true, default: prismaMock };
});

// Mock Redis / BullMQ to avoid real Redis calls
jest.mock("../src/config/redis", () => ({
    redis: { quit: jest.fn() },
    redisOptions_: { host: "localhost", port: 6379, maxRetriesPerRequest: null },
}));

jest.mock("../src/jobs/analyticsQueue", () => ({
    analyticsQueue: { add: jest.fn() },
    enqueueAnalyticsJob: jest.fn(),
    ANALYTICS_QUEUE_NAME: "analytics",
}));
