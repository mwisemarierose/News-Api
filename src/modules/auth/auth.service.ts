import argon2 from "argon2";
import prisma from "../../config/prisma";
import { signToken } from "../../utils/jwt";
import { SignupInput, LoginInput } from "./auth.validator";
import { AppError } from "../../middleware/errorHandler";

export async function signup(input: SignupInput) {
    const { name, email, password, role } = input;

    // Check for duplicate email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
        throw new AppError("Email already in use", 409, ["Duplicate email"]);
    }

    // Hash password with Argon2
    const hashedPassword = await argon2.hash(password);

    const user = await prisma.user.create({
        data: { name, email, password: hashedPassword, role },
        select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    return user;
}

export async function login(input: LoginInput) {
    const { email, password } = input;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        throw new AppError("Invalid credentials", 401, ["Email or password is incorrect"]);
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
        throw new AppError("Invalid credentials", 401, ["Email or password is incorrect"]);
    }

    const token = signToken({ sub: user.id, role: user.role });

    return {
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
    };
}
