import { salespersons } from "@/drizzle/schema";

export type Salesperson = typeof salespersons.$inferSelect;
