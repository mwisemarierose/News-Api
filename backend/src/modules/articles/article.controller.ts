import { Request, Response, NextFunction } from "express";
import {
    createArticle,
    getMyArticles,
    updateArticle,
    softDeleteArticle,
    getPublishedArticles,
    getArticleById,
} from "./article.service";
import { sendSuccess, sendPaginated } from "../../utils/response";

export async function createArticleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const article = await createArticle(req.user!.sub, req.body);
        sendSuccess(res, "Article created successfully", article, 201);
    } catch (err) {
        next(err);
    }
}

export async function getMyArticlesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const p = Number(req.query.page) || 1;
        const ps = Number(req.query.pageSize) || 10;
        const withDeleted = req.query.includeDeleted === "true";

        const { articles, total } = await getMyArticles(req.user!.sub, p, ps, withDeleted);
        sendPaginated(res, "Articles retrieved", articles, p, ps, total);
    } catch (err) {
        next(err);
    }
}

export async function updateArticleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.params["id"] as string;
        const article = await updateArticle(id, req.user!.sub, req.body);
        sendSuccess(res, "Article updated successfully", article);
    } catch (err) {
        next(err);
    }
}

export async function deleteArticleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const id = req.params["id"] as string;
        await softDeleteArticle(id, req.user!.sub);
        sendSuccess(res, "Article deleted successfully", null);
    } catch (err) {
        next(err);
    }
}

export async function getPublishedArticlesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const p = Number(req.query.page) || 1;
        const ps = Number(req.query.pageSize) || 10;
        const category = req.query.category as string | undefined;
        const author = req.query.author as string | undefined;
        const q = req.query.q as string | undefined;

        const { articles, total } = await getPublishedArticles(p, ps, category, author, q);
        sendPaginated(res, "Articles retrieved", articles, p, ps, total);
    } catch (err) {
        next(err);
    }
}

export async function getArticleByIdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {

        const id = req.params["id"] as string;
        const readerId = req.user?.sub ?? undefined;
        const article = await getArticleById(id, readerId);
        sendSuccess(res, "Article retrieved", article);
    } catch (err) {
        next(err);
    }
}
