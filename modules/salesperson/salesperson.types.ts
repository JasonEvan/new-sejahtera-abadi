import { salespersons } from "@/drizzle/schema";
import z from "zod";
import { addSalespersonValidation } from "./salesperson.validation";

export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesperson = z.infer<typeof addSalespersonValidation>;
