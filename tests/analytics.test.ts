import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import { signToken } from "../src/utils/jwt";
import { processAnalytics } from "../src/jobs/analyticsWorker";

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

const authorToken = signToken({ sub: "author-uuid", role: "author" });
const readerToken = signToken({ sub: "reader-uuid", role: "reader" });

const mockDashboardRows = [
    {
        id: "article-uuid",
        title: "My Article",
        status: "Published" as const,
        createdAt: new Date(),
        dailyAnalytics: [{ viewCount: 50 }, { viewCount: 30 }],
    },
];

describe("Analytics Routes", () => {
    // ─── GET /author/dashboard ────────────────────────────────────────────────

    describe("GET /author/dashboard", () => {
        it("should return paginated dashboard with TotalViews", async () => {
            // $transaction with array arg returns PrismaPromise[] result
            // jest-mock-extended resolves to whatever we provide here
            (prismaMock.$transaction as jest.Mock).mockResolvedValue([mockDashboardRows, 1]);

            const res = await request(app)
                .get("/author/dashboard")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
            expect(res.body.Object[0].totalViews).toBe(80);
            expect(res.body.TotalSize).toBe(1);
        });

        it("should return 0 TotalViews when no analytics exist", async () => {
            const noViewRows = [
                {
                    id: "article-uuid",
                    title: "My Article",
                    status: "Draft" as const,
                    createdAt: new Date(),
                    dailyAnalytics: [],
                },
            ];
            (prismaMock.$transaction as jest.Mock).mockResolvedValue([noViewRows, 1]);

            const res = await request(app)
                .get("/author/dashboard")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.Object[0].totalViews).toBe(0);
        });

        it("should return 403 if reader tries to access dashboard", async () => {
            const res = await request(app)
                .get("/author/dashboard")
                .set("Authorization", `Bearer ${readerToken}`);

            expect(res.status).toBe(403);
        });

        it("should return 401 if unauthenticated", async () => {
            const res = await request(app).get("/author/dashboard");
            expect(res.status).toBe(401);
        });

        it("should support pagination via query params", async () => {
            (prismaMock.$transaction as jest.Mock).mockResolvedValue([[], 0]);

            const res = await request(app)
                .get("/author/dashboard?page=2&pageSize=5")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.PageNumber).toBe(2);
            expect(res.body.PageSize).toBe(5);
        });
    });
});

// ─── Analytics Worker (Job Aggregation Logic) ─────────────────────────────────

describe("Analytics Worker - processAnalytics", () => {
    it("should aggregate read logs and upsert into DailyAnalytics", async () => {
        const date = "2024-01-15";

        (prismaMock.readLog.findMany as jest.Mock).mockResolvedValue([
            { articleId: "article-a" },
            { articleId: "article-a" },
            { articleId: "article-b" },
        ]);

        (prismaMock.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

        await processAnalytics({ data: { date } } as any);

        expect(prismaMock.readLog.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ readAt: expect.any(Object) }),
            })
        );
        expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it("should skip upsert if no read logs exist for the day", async () => {
        (prismaMock.readLog.findMany as jest.Mock).mockResolvedValue([]);

        await processAnalytics({ data: { date: "2024-01-15" } } as any);

        expect(prismaMock.$transaction).not.toHaveBeenCalled();
    });
});
