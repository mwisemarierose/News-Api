import jwt, { SignOptions } from "jsonwebtoken";

export interface JwtPayload {
    sub: string;
    role: string;
}

const secret = process.env.JWT_SECRET as string;
const expiresIn = (process.env.JWT_EXPIRES_IN ?? "24h") as SignOptions["expiresIn"];

export function signToken(payload: JwtPayload): string {
    return jwt.sign(payload, secret, { expiresIn });
}

export function verifyToken(token: string): JwtPayload {
    return jwt.verify(token, secret) as JwtPayload;
}
