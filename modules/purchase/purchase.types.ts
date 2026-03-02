import z from "zod";
import {
  backendPurchaseValidation,
  createItemValidation,
} from "./purchase.validation";

export type PurchaseTableRow = {
  id: string;
  stock_id: number;
  name: string;
  quantity: number;
  product_price: number;
  selling_price: number;
  subtotal: number;
};

export type ItemValidation = z.infer<typeof createItemValidation>;

export type InsertPurchase = z.infer<typeof backendPurchaseValidation>;
