import { z } from "zod";

const nameRegex = /^[a-zA-Z ]+$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d]).{8,}$/;

export const signupSchema = z.object({
    name: z
        .string()
        .min(1, "Name is required")
        .regex(nameRegex, "Name must contain only letters and spaces"),
    email: z.string().email("Invalid email format"),
    password: z
        .string()
        .regex(
            passwordRegex,
            "Password must be at least 8 characters and include uppercase, lowercase, number, and special character"
        ),
    role: z.enum(["author", "reader"] as const, {
        error: "Role must be either \"author\" or \"reader\"",
    }),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
