import { z } from "zod";

export const createArticleSchema = z.object({
    title: z
        .string()
        .min(1, "Title is required")
        .max(150, "Title must be at most 150 characters"),
    content: z
        .string()
        .min(50, "Content must be at least 50 characters"),
    category: z.string().min(1, "Category is required"),
    status: z.enum(["Draft", "Published"]).optional().default("Draft"),
});

export const updateArticleSchema = z.object({
    title: z
        .string()
        .min(1)
        .max(150, "Title must be at most 150 characters")
        .optional(),
    content: z.string().min(50, "Content must be at least 50 characters").optional(),
    category: z.string().min(1).optional(),
    status: z.enum(["Draft", "Published"]).optional(),
});

export const articleQuerySchema = z.object({
    category: z.string().optional(),
    author: z.string().optional(),
    q: z.string().optional(),
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export const myArticlesQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
    includeDeleted: z.enum(["true", "false"]).optional().default("false"),
});

export const dashboardQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
