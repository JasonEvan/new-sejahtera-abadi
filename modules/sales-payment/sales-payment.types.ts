import z from "zod";
import {
  backendSalesPaymentValidation,
  createSalesPaymentValidation,
  editSalesPaymentValidation,
} from "./sales-payment.validation";

export interface SalesPaymentTableRow {
  id: string;
  sales_order_id: number;
  invoice_number: string;
  balance_due: number;
  paid_amount: number;
}

export type SalesPaymentFormField = z.infer<
  ReturnType<typeof createSalesPaymentValidation>
>;

export type EditSalesPaymentFormField = z.infer<
  ReturnType<typeof editSalesPaymentValidation>
>;

export type InsertSalesPayment = z.infer<typeof backendSalesPaymentValidation>;
