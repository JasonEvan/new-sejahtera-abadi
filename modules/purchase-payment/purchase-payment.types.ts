import z from "zod";
import {
  backendPurchasePaymentValidation,
  createPurchasePaymentValidation,
  editPurchasePaymentValidation,
} from "./purchase-payment.validation";

export interface PurchasePaymentTableRow {
  id: string;
  purchase_order_id: number;
  invoice_number: string;
  balance_due: number;
  paid_amount: number;
}

export interface PurchasePaymentHistoryRow {
  id: number;
  transaction_number: string;
  payment_date: string;
  paid_amount: number;
}

export interface PurchasePaymentTransactionSummaryItem {
  id: number;
  paid_amount: number;
  payment_date: string;
  invoice_number: string;
  invoice_value: number;
  balance_due: number;
}

export interface PurchasePaymentTransactionSummary {
  transaction_number: string;
  payment_date: string;
  total_paid: number;
  invoice_count: number;
  payments: PurchasePaymentTransactionSummaryItem[];
}

export interface EditPayablesInvoiceDetail {
  invoice_number: string;
  invoice_value: number;
  paid_amount: number;
  balance_due: number;
  payments: PurchasePaymentHistoryRow[];
}

export interface EditPayablesPaymentInput {
  transaction_number: string;
  payment_date: string;
  paid_amount: number;
}

export interface DeleteEditPayablesByInvoiceInput {
  invoice_number: string;
}

export interface UpdateEditPayablesByInvoiceInput {
  transaction_number: string;
  payments: {
    invoice_number: string;
    paid_amount: number;
    payment_date?: string;
  }[];
}

export type PurchasePaymentFormField = z.infer<
  ReturnType<typeof createPurchasePaymentValidation>
>;

export type EditPurchasePaymentFormField = z.infer<
  ReturnType<typeof editPurchasePaymentValidation>
>;

export type InsertPurchasePayment = z.infer<
  typeof backendPurchasePaymentValidation
>;
