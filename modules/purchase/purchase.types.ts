import z from "zod";
import {
  backendEditPurchaseValidation,
  backendPurchaseValidation,
  createItemValidation,
} from "./purchase.validation";
import { purchase_orders } from "@/drizzle/schema";

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
export type EditPurchase = z.infer<typeof backendEditPurchaseValidation>;

export type PurchaseOrder = typeof purchase_orders.$inferSelect;

export type PurchaseInvoiceRow = {
  invoice_number: string;
  name: string;
  city: string;
  invoice_value: number;
  balance_due: number;
};

export type PurchaseInvoiceDetailLine = {
  name: string | null;
  qty: number | null;
  unit: string | null;
  price: number | null;
  total_price: number;
};

export type PurchaseInvoiceHeader = {
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  client_name: string;
  client_city: string;
};

export type LatestPurchasedItem = {
  name: string;
  price: number;
  bought_at: string;
};
