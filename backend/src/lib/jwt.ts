import { verify } from "jsonwebtoken";

export function verifyJwtPayload(token, secret) {
  const payload = verify(token, secret);
  if (typeof payload === "string") {
    throw new Error("JWT payload must be an object");
  }
  return payload;
}
