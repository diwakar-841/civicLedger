import { verify } from "jsonwebtoken";

// Not currently imported anywhere else in the codebase (all call sites use
// jsonwebtoken directly) — kept for now as a shared, correctly-hardened
// entry point for any future code that needs one.
export function verifyJwtPayload(token: string, secret: string) {
  const payload = verify(token, secret, { algorithms: ["HS256"] });
  if (typeof payload === "string") {
    throw new Error("JWT payload must be an object");
  }
  return payload;
}
