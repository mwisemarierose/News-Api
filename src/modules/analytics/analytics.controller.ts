import { Request, Response, NextFunction } from "express";
import { getAuthorDashboard } from "./analytics.service";
import { sendPaginated } from "../../utils/response";

export async function dashboardHandler(
    req: Request,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const page = Number(req.query.page) || 1;
        const pageSize = Number(req.query.pageSize) || 10;

        const { articles, total } = await getAuthorDashboard(
            req.user!.sub,
            page,
            pageSize
        );
        sendPaginated(res, "Dashboard data retrieved", articles, page, pageSize, total);
    } catch (err) {
        next(err);
    }
}
