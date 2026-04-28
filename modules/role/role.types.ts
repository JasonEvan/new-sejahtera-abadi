import { roles } from "@/drizzle/schema";

export type Role = typeof roles.$inferSelect & {
  permissionsCount?: number;
};
export type InsertRole = typeof roles.$inferInsert;
