import prisma from "../../config/prisma";
import { AppError } from "../../middleware/errorHandler";
import { CreateArticleInput, UpdateArticleInput } from "./article.validator";
import { ArticleStatus, Prisma } from "@prisma/client";

// ─── Author CRUD ──────────────────────────────────────────────────────────────

export async function createArticle(authorId: string, input: CreateArticleInput) {
    return prisma.article.create({
        data: { ...input, authorId },
        select: articleSelect,
    });
}

export async function getMyArticles(
    authorId: string,
    page: number,
    pageSize: number,
    includeDeleted: boolean
) {
    const where: Prisma.ArticleWhereInput = {
        authorId,
        ...(includeDeleted ? {} : { deletedAt: null }),
    };

    const [articles, total] = await prisma.$transaction([
        prisma.article.findMany({
            where,
            select: {
                ...articleSelect,
                deletedAt: true,
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.article.count({ where }),
    ]);

    return { articles, total };
}

export async function updateArticle(
    id: string,
    authorId: string,
    input: UpdateArticleInput
) {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article || article.deletedAt) {
        throw new AppError("Article not found", 404, ["Article does not exist"]);
    }
    if (article.authorId !== authorId) {
        throw new AppError("Forbidden", 403, ["You can only edit your own articles"]);
    }

    return prisma.article.update({
        where: { id },
        data: input,
        select: articleSelect,
    });
}

export async function softDeleteArticle(id: string, authorId: string) {
    const article = await prisma.article.findUnique({ where: { id } });
    if (!article || article.deletedAt) {
        throw new AppError("Article not found", 404, ["Article does not exist"]);
    }
    if (article.authorId !== authorId) {
        throw new AppError("Forbidden", 403, ["You can only delete your own articles"]);
    }

    return prisma.article.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: articleSelect,
    });
}

// ─── Public Feed ──────────────────────────────────────────────────────────────

export async function getPublishedArticles(
    page: number,
    pageSize: number,
    category?: string,
    author?: string,
    q?: string
) {
    const where: Prisma.ArticleWhereInput = {
        status: ArticleStatus.Published,
        deletedAt: null,
        ...(category ? { category } : {}),
        ...(author
            ? { author: { name: { contains: author, mode: Prisma.QueryMode.insensitive } } }
            : {}),
        ...(q ? { title: { contains: q, mode: Prisma.QueryMode.insensitive } } : {}),
    };

    const [articles, total] = await prisma.$transaction([
        prisma.article.findMany({
            where,
            select: articleSelect,
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.article.count({ where }),
    ]);

    return { articles, total };
}

// ─── Article Detail + Read Tracking ──────────────────────────────────────────

export async function getArticleById(id: string, readerId?: string) {
    const article = await prisma.article.findUnique({
        where: { id },
        select: { ...articleSelect, deletedAt: true },
    });

    if (!article) {
        throw new AppError("Article not found", 404, ["Article does not exist"]);
    }
    if (article.deletedAt) {
        throw new AppError(
            "News article no longer available",
            410,
            ["This article has been deleted"]
        );
    }

    // Non-blocking read log — fire and forget, never blocks response
    setImmediate(() => {
        prisma.readLog
            .create({
                data: {
                    articleId: id,
                    readerId: readerId ?? null,
                },
            })
            .catch((err) => {
                if (process.env.NODE_ENV !== "test") {
                    console.error("[ReadLog] Failed to record read event:", err);
                }
            });
    });

    return article;
}

// ─── Shared Select ────────────────────────────────────────────────────────────

const articleSelect = {
    id: true,
    title: true,
    content: true,
    category: true,
    status: true,
    authorId: true,
    author: { select: { id: true, name: true, email: true } },
    createdAt: true,
    updatedAt: true,
} satisfies Prisma.ArticleSelect;
