import { clients } from "@/drizzle/schema";

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
