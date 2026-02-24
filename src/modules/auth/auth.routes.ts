import { Router } from "express";
import { signupHandler, loginHandler } from "./auth.controller";
import { validate } from "../../middleware/validate";
import { signupSchema, loginSchema } from "./auth.validator";

const router = Router();

/**
 * POST /auth/signup
 * US1: Create a new account with role-based access
 */
router.post("/signup", validate(signupSchema), signupHandler);

/**
 * POST /auth/login
 * US2: Authenticate and receive JWT
 */
router.post("/login", validate(loginSchema), loginHandler);

export default router;
