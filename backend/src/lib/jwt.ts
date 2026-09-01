import { verify, type JwtPayload } from "jsonwebtoken";

export type AppJwtPayload = JwtPayload & {
  userId: string;
  role?: string;
  purpose?: string;
  requestId?: string;
};

export function verifyJwtPayload(token: string, secret: string): AppJwtPayload {
  const payload = verify(token, secret);
  if (typeof payload === "string") {
    throw new Error("JWT payload must be an object");
  }
  return payload as AppJwtPayload;
}