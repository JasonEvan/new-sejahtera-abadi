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

export type PurchasePaymentFormField = z.infer<
  ReturnType<typeof createPurchasePaymentValidation>
>;

export type EditPurchasePaymentFormField = z.infer<
  ReturnType<typeof editPurchasePaymentValidation>
>;

export type InsertPurchasePayment = z.infer<
  typeof backendPurchasePaymentValidation
>;
