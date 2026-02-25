import { clients } from "@/drizzle/schema";
import z from "zod";
import { addClientValidation } from "./client.validation";

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof addClientValidation>;
