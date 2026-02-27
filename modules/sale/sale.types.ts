import z from "zod";
import { createItemValidation } from "./sale.validation";

export type SaleTableRow = {
  id: string;
  stock_id: number;
  name: string;
  quantity: number;
  capital_cost: number;
  selling_price: number;
  subtotal: number;
};

export type ItemValidation = z.infer<ReturnType<typeof createItemValidation>>;
