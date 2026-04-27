import { users } from "@/drizzle/schema";

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
