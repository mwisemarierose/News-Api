import prisma from "../../config/prisma";

export async function getAuthorDashboard(
    authorId: string,
    page: number,
    pageSize: number
) {
    const where = {
        authorId,
        deletedAt: null,
    };

    const [articles, total] = await prisma.$transaction([
        prisma.article.findMany({
            where,
            select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
                dailyAnalytics: {
                    select: { viewCount: true },
                },
            },
            skip: (page - 1) * pageSize,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        }),
        prisma.article.count({ where }),
    ]);

    const result = articles.map((a) => ({
        id: a.id,
        title: a.title,
        status: a.status,
        createdAt: a.createdAt,
        totalViews: a.dailyAnalytics.reduce((sum, d) => sum + d.viewCount, 0),
    }));

    return { articles: result, total };
}
