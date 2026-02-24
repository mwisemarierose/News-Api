import request from "supertest";
import app from "../src/app";
import prisma from "../src/config/prisma";
import { mockDeep } from "jest-mock-extended";
import type { PrismaClient } from "@prisma/client";
import * as argon2 from "argon2";
import { signToken } from "../src/utils/jwt";

const prismaMock = prisma as unknown as ReturnType<typeof mockDeep<PrismaClient>>;

jest.mock("argon2", () => ({
    hash: jest.fn().mockResolvedValue("hashed_password"),
    verify: jest.fn(),
}));

describe("Auth Routes", () => {
    // ─── POST /auth/signup ───────────────────────────────────────────────────

    describe("POST /auth/signup", () => {
        const validPayload = {
            name: "Jane Doe",
            email: "jane@example.com",
            password: "Str0ng!Pass",
            role: "author",
        };

        it("should create a new user and return 201", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);
            prismaMock.user.create.mockResolvedValue({
                id: "uuid-1",
                name: "Jane Doe",
                email: "jane@example.com",
                role: "author",
                createdAt: new Date(),
            } as any);

            const res = await request(app).post("/auth/signup").send(validPayload);

            expect(res.status).toBe(201);
            expect(res.body.Success).toBe(true);
            expect(res.body.Object.email).toBe("jane@example.com");
        });

        it("should return 409 for duplicate email", async () => {
            prismaMock.user.findUnique.mockResolvedValue({ id: "uuid-1" } as any);

            const res = await request(app).post("/auth/signup").send(validPayload);

            expect(res.status).toBe(409);
            expect(res.body.Success).toBe(false);
            expect(res.body.Errors).toContain("Duplicate email");
        });

        it("should return 422 for weak password", async () => {
            const res = await request(app)
                .post("/auth/signup")
                .send({ ...validPayload, password: "weak" });

            expect(res.status).toBe(422);
            expect(res.body.Success).toBe(false);
        });

        it("should return 422 for invalid name (digits not allowed)", async () => {
            const res = await request(app)
                .post("/auth/signup")
                .send({ ...validPayload, name: "Jane123" });

            expect(res.status).toBe(422);
            expect(res.body.Success).toBe(false);
        });

        it("should return 422 for invalid role", async () => {
            const res = await request(app)
                .post("/auth/signup")
                .send({ ...validPayload, role: "admin" });

            expect(res.status).toBe(422);
            expect(res.body.Success).toBe(false);
        });

        it("should return 422 for invalid email", async () => {
            const res = await request(app)
                .post("/auth/signup")
                .send({ ...validPayload, email: "not-an-email" });

            expect(res.status).toBe(422);
            expect(res.body.Success).toBe(false);
        });
    });

    // ─── POST /auth/login ────────────────────────────────────────────────────

    describe("POST /auth/login", () => {
        const loginPayload = { email: "jane@example.com", password: "Str0ng!Pass" };

        it("should return 200 with JWT on valid credentials", async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: "uuid-1",
                name: "Jane Doe",
                email: "jane@example.com",
                password: "hashed_password",
                role: "author",
            } as any);
            (argon2.verify as jest.Mock).mockResolvedValue(true);

            const res = await request(app).post("/auth/login").send(loginPayload);

            expect(res.status).toBe(200);
            expect(res.body.Success).toBe(true);
            expect(res.body.Object.token).toBeDefined();
        });

        it("should return 401 if user not found", async () => {
            prismaMock.user.findUnique.mockResolvedValue(null);

            const res = await request(app).post("/auth/login").send(loginPayload);

            expect(res.status).toBe(401);
            expect(res.body.Success).toBe(false);
        });

        it("should return 401 for wrong password", async () => {
            prismaMock.user.findUnique.mockResolvedValue({
                id: "uuid-1",
                password: "hashed_password",
                role: "author",
            } as any);
            (argon2.verify as jest.Mock).mockResolvedValue(false);

            const res = await request(app).post("/auth/login").send(loginPayload);

            expect(res.status).toBe(401);
            expect(res.body.Success).toBe(false);
        });
    });
});
