import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@/drizzle/schema";

const sql = postgres(process.env.DATABASE_URL!, {
  prepare: false, // Disable prefetch as it is not supported for "Transaction" pool mode
  max: 1, // For web serverless environment like vercel
});

const db = drizzle(sql, { schema });

export default db;
