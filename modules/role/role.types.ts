import { roles } from "@/drizzle/schema";

export type Role = typeof roles.$inferSelect;
export type InsertRole = typeof roles.$inferInsert;
