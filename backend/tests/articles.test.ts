import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import { signToken } from "../src/utils/jwt";

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

const authorToken = signToken({ sub: "author-uuid", role: "author" });
const readerToken = signToken({ sub: "reader-uuid", role: "reader" });

const mockArticle = {
    id: "article-uuid",
    title: "Test Article About Technology",
    content: "This is a long enough content body to pass the 50 char minimum validation check.",
    category: "Tech",
    status: "Published" as const,
    authorId: "author-uuid",
    author: { id: "author-uuid", name: "Jane Doe", email: "jane@example.com" },
    createdAt: new Date(),
    updatedAt: new Date(),
};

describe("Articles Routes", () => {
    // POST /articles

    describe("POST /articles", () => {
        const payload = {
            title: "Breaking News Title",
            content: "This is the article content that is long enough to pass minimum validation requirements.",
            category: "Politics",
        };

        it("should create an article as author and return 201", async () => {
            prismaMock.article.create.mockResolvedValue({ ...mockArticle, status: "Draft" } as any);

            const res = await request(app)
                .post("/articles")
                .set("Authorization", `Bearer ${authorToken}`)
                .send(payload);

            expect(res.status).toBe(201);
            expect(res.body.Success).toBe(true);
            expect(res.body.Object.title).toBeDefined();
        });

        it("should return 403 if reader tries to create article", async () => {
            const res = await request(app)
                .post("/articles")
                .set("Authorization", `Bearer ${readerToken}`)
                .send(payload);

            expect(res.status).toBe(403);
            expect(res.body.Success).toBe(false);
        });

        it("should return 401 if no token provided", async () => {
            const res = await request(app).post("/articles").send(payload);
            expect(res.status).toBe(401);
        });

        it("should return 422 if title is missing", async () => {
            const res = await request(app)
                .post("/articles")
                .set("Authorization", `Bearer ${authorToken}`)
                .send({ ...payload, title: "" });

            expect(res.status).toBe(422);
        });

        it("should return 422 if content is too short (< 50 chars)", async () => {
            const res = await request(app)
                .post("/articles")
                .set("Authorization", `Bearer ${authorToken}`)
                .send({ ...payload, content: "Too short" });

            expect(res.status).toBe(422);
        });
    });

    // GET /articles

    describe("GET /articles", () => {
        it("should return paginated published articles", async () => {
            prismaMock.$transaction.mockResolvedValue([[mockArticle], 1] as any);

            const res = await request(app).get("/articles");

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
            expect(Array.isArray(res.body.Object)).toBe(true);
            expect(res.body.TotalSize).toBe(1);
        });

        it("should support category filter", async () => {
            prismaMock.$transaction.mockResolvedValue([[mockArticle], 1] as any);

            const res = await request(app).get("/articles?category=Tech");

            expect(res.status).toBe(200);
        });

        it("should support keyword search via q param", async () => {
            prismaMock.$transaction.mockResolvedValue([] as any);
            const res = await request(app).get("/articles?q=Breaking");
            expect(res.status).toBe(200);
        });
    });

    // GET /articles/:id 

    describe("GET /articles/:id", () => {
        it("should return article and trigger read log for guest", async () => {
            prismaMock.article.findUnique.mockResolvedValue(mockArticle as any);
            prismaMock.readLog.create.mockResolvedValue({} as any);

            const res = await request(app).get("/articles/article-uuid");

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
            expect(res.body.Object.id).toBe("article-uuid");
        });

        it("should return 410 for soft-deleted article", async () => {
            prismaMock.article.findUnique.mockResolvedValue({
                ...mockArticle,
                deletedAt: new Date(),
            } as any);

            const res = await request(app).get("/articles/article-uuid");

            expect(res.status).toBe(410);
            expect(res.body.Success).toBe(false);
            expect(res.body.Message).toBe("News article no longer available");
        });

        it("should return 404 for non-existent article", async () => {
            prismaMock.article.findUnique.mockResolvedValue(null);

            const res = await request(app).get("/articles/nonexistent-id");

            expect(res.status).toBe(404);
        });
    });

    //PUT /articles/:id 

    describe("PUT /articles/:id", () => {
        it("should update own article", async () => {
            prismaMock.article.findUnique.mockResolvedValue(mockArticle as any);
            prismaMock.article.update.mockResolvedValue({
                ...mockArticle,
                title: "Updated Title",
            } as any);

            const res = await request(app)
                .put("/articles/article-uuid")
                .set("Authorization", `Bearer ${authorToken}`)
                .send({ title: "Updated Title" });

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
        });

        it("should return 403 when editing another author's article", async () => {
            prismaMock.article.findUnique.mockResolvedValue({
                ...mockArticle,
                authorId: "other-author-uuid",
            } as any);

            const res = await request(app)
                .put("/articles/article-uuid")
                .set("Authorization", `Bearer ${authorToken}`)
                .send({ title: "Updated Title" });

            expect(res.status).toBe(403);
            expect(res.body.Success).toBe(false);
        });
    });

    // DELETE /articles/:id 

    describe("DELETE /articles/:id", () => {
        it("should soft-delete own article (set deletedAt)", async () => {
            prismaMock.article.findUnique.mockResolvedValue(mockArticle as any);
            prismaMock.article.update.mockResolvedValue({
                ...mockArticle,
                deletedAt: new Date(),
            } as any);

            const res = await request(app)
                .delete("/articles/article-uuid")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
        });

        it("should return 403 when deleting another author's article", async () => {
            prismaMock.article.findUnique.mockResolvedValue({
                ...mockArticle,
                authorId: "other-author-uuid",
            } as any);

            const res = await request(app)
                .delete("/articles/article-uuid")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(403);
        });
    });

    // GET /articles/me 

    describe("GET /articles/me", () => {
        it("should return author's own articles (drafts + published)", async () => {
            prismaMock.$transaction.mockResolvedValue([[mockArticle], 1] as any);

            const res = await request(app)
                .get("/articles/me")
                .set("Authorization", `Bearer ${authorToken}`);

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
            expect(res.body.TotalSize).toBe(1);
        });

        it("should return 403 if reader tries to access /me", async () => {
            const res = await request(app)
                .get("/articles/me")
                .set("Authorization", `Bearer ${readerToken}`);

            expect(res.status).toBe(403);
        });
    });
});
