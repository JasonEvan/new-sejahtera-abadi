import { stocks } from "@/drizzle/schema";
import z from "zod";
import { addStockValidation } from "./stock.validation";

export type Stock = typeof stocks.$inferSelect;
export type InsertStock = z.infer<typeof addStockValidation>;
