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

export interface SalesPaymentHistoryRow {
  id: number;
  transaction_number: string;
  payment_date: string;
  paid_amount: number;
}

export interface EditReceivablesInvoiceDetail {
  invoice_number: string;
  invoice_value: number;
  paid_amount: number;
  balance_due: number;
  payments: SalesPaymentHistoryRow[];
}

export interface EditReceivablesPaymentInput {
  transaction_number: string;
  payment_date: string;
  paid_amount: number;
}

export interface DeleteEditReceivablesByInvoiceInput {
  invoice_number: string;
}

export interface UpdateEditReceivablesByInvoiceInput {
  transaction_number: string;
  payments: {
    invoice_number: string;
    paid_amount: number;
    payment_date?: string;
  }[];
}

export type SalesPaymentFormField = z.infer<
  ReturnType<typeof createSalesPaymentValidation>
>;

export type EditSalesPaymentFormField = z.infer<
  ReturnType<typeof editSalesPaymentValidation>
>;

export type InsertSalesPayment = z.infer<typeof backendSalesPaymentValidation>;
