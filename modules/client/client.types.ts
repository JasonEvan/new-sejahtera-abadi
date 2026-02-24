import { clients } from "@/drizzle/schema";

export type Client = typeof clients.$inferSelect;
