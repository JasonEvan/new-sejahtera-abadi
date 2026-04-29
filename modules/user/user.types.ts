import { users } from "@/drizzle/schema";

export type User = typeof users.$inferSelect & {
  role?: string;
  permissions?: string[];
};
export type InsertUser = typeof users.$inferInsert;
