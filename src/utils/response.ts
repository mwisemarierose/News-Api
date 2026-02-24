import { Response } from "express";

export interface BaseResponse<T> {
    Success: boolean;
    Message: string;
    Object: T | null;
    Errors: string[] | null;
}

export interface PaginatedResponse<T> {
    Success: boolean;
    Message: string;
    Object: T[];
    PageNumber: number;
    PageSize: number;
    TotalSize: number;
    Errors: null;
}

export function sendSuccess<T>(
    res: Response,
    message: string,
    data: T,
    statusCode = 200
): Response {
    const body: BaseResponse<T> = {
        Success: true,
        Message: message,
        Object: data,
        Errors: null,
    };
    return res.status(statusCode).json(body);
}

export function sendError(
    res: Response,
    message: string,
    errors: string[] = [],
    statusCode = 400
): Response {
    const body: BaseResponse<null> = {
        Success: false,
        Message: message,
        Object: null,
        Errors: errors.length > 0 ? errors : null,
    };
    return res.status(statusCode).json(body);
}

export function sendPaginated<T>(
    res: Response,
    message: string,
    data: T[],
    pageNumber: number,
    pageSize: number,
    totalSize: number
): Response {
    const body: PaginatedResponse<T> = {
        Success: true,
        Message: message,
        Object: data,
        PageNumber: pageNumber,
        PageSize: pageSize,
        TotalSize: totalSize,
        Errors: null,
    };
    return res.status(200).json(body);
}
