import { stocks } from "@/drizzle/schema";

export type Stock = typeof stocks.$inferSelect;
