import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export * from "./schema";
export { eq, and, or, sql, desc, asc, inArray } from "drizzle-orm";

export const db = drizzle(process.env.DATABASE_URL!, { schema });
