import z from "zod";
import {
  backendEditSaleValidation,
  backendSaleValidation,
  createItemValidation,
} from "./sale.validation";
import { sales_orders } from "@/drizzle/schema";

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

export type InsertSale = z.infer<typeof backendSaleValidation>;
export type EditSale = z.infer<typeof backendEditSaleValidation>;

export type SalesOrder = typeof sales_orders.$inferSelect;

export type SalesInvoiceRow = {
  invoice_number: string;
  name: string;
  city: string;
  invoice_value: number;
  balance_due: number;
};

export type SalesInvoiceDetailLine = {
  name: string | null;
  qty: number | null;
  unit: string | null;
  price: number | null;
  total_price: number;
};

export type SalesInvoiceHeader = {
  invoice_number: string;
  invoice_date: string;
  invoice_value: number;
  client_name: string;
  client_city: string;
  client_address: string | null;
  sales_code: string;
};

export type LatestSoldItem = {
  name: string;
  price: number;
  sold_at: string;
};
