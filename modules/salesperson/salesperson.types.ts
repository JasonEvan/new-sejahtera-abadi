import { salespersons } from "@/drizzle/schema";
import z from "zod";
import {
  addSalespersonValidation,
  editSalespersonValidation,
} from "./salesperson.validation";

export type Salesperson = typeof salespersons.$inferSelect;
export type InsertSalesperson = z.infer<typeof addSalespersonValidation>;
export type EditSalesperson = z.infer<typeof editSalespersonValidation>;
