import { Request, Response, NextFunction } from "express";
import { signup, login } from "./auth.service";
import { sendSuccess } from "../../utils/response";

export async function signupHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const user = await signup(req.body);
        sendSuccess(res, "Account created successfully", user, 201);
    } catch (err) {
        next(err);
    }
}

export async function loginHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
        const result = await login(req.body);
        sendSuccess(res, "Login successful", result);
    } catch (err) {
        next(err);
    }
}
