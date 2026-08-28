import { drizzle } from "drizzle-orm/node-postgres/driver";
import { Pool } from "pg";
import * as users from "./schema/users";
import * as elections from "./schema/elections";
import * as candidates from "./schema/candidates";
import * as votesCache from "./schema/votesCache";
import * as auditLog from "./schema/auditLog";
import * as sessions from "./schema/sessions";
import * as webauthnCredentials from "./schema/webauthnCredentials";
import * as notifications from "./schema/notifications";
import * as candidateRequests from "./schema/candidateRequests";
import * as groups from "./schema/groups";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, {
  schema: {
    ...users,
    ...elections,
    ...candidates,
    ...votesCache,
    ...auditLog,
    ...sessions,
    ...webauthnCredentials,
    ...notifications,
    ...candidateRequests,
    ...groups,
  },
});

export * from "./schema/users";
export * from "./schema/elections";
export * from "./schema/candidates";
export * from "./schema/votesCache";
export * from "./schema/auditLog";
export * from "./schema/sessions";
export * from "./schema/webauthnCredentials";
export * from "./schema/notifications";
export * from "./schema/candidateRequests";
export * from "./schema/groups";
