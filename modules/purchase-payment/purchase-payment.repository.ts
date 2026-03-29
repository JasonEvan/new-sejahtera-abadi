import { Tx } from "@/lib/common-types";
import {
  EditPayablesPaymentInput,
  InsertPurchasePayment,
} from "./purchase-payment.types";
import db from "@/lib/drizzle";
import { purchase_orders, purchase_payments } from "@/drizzle/schema";
import { asc, eq } from "drizzle-orm";
import dayjs from "dayjs";

export const purchasePaymentRepository = {
  createPurchasePayment(data: InsertPurchasePayment, tx?: Tx) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      client_id: data.client_id,
      paid_amount: item.paid_amount,
      payment_date: dayjs(data.transaction_date).toDate(),
      purchase_order_id: item.purchase_order_id,
      transaction_number: data.transaction_number,
    }));

    return database.insert(purchase_payments).values(mappedData);
  },

  async getEditPayablesByInvoice(invoiceNumber: string) {
    const [invoice] = await db
      .select({
        id: purchase_orders.id,
        invoice_number: purchase_orders.invoice_number,
        invoice_value: purchase_orders.invoice_value,
        paid_amount: purchase_orders.paid_amount,
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .where(eq(purchase_orders.invoice_number, invoiceNumber));

    if (!invoice) {
      return null;
    }

    const payments = await db
      .select({
        id: purchase_payments.id,
        transaction_number: purchase_payments.transaction_number,
        payment_date: purchase_payments.payment_date,
        paid_amount: purchase_payments.paid_amount,
      })
      .from(purchase_payments)
      .where(eq(purchase_payments.purchase_order_id, invoice.id))
      .orderBy(asc(purchase_payments.payment_date), asc(purchase_payments.id));

    return {
      invoice,
      payments,
    };
  },

  getByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .select({
        id: purchase_payments.id,
        paid_amount: purchase_payments.paid_amount,
      })
      .from(purchase_payments)
      .where(eq(purchase_payments.purchase_order_id, purchaseOrderId));
  },

  deleteByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .delete(purchase_payments)
      .where(eq(purchase_payments.purchase_order_id, purchaseOrderId));
  },

  insertEditPayablesPaymentRows(
    data: {
      client_id: number;
      purchase_order_id: number;
      payments: EditPayablesPaymentInput[];
    },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    const mappedData = data.payments.map((item) => ({
      client_id: data.client_id,
      purchase_order_id: data.purchase_order_id,
      transaction_number: item.transaction_number,
      payment_date: dayjs(item.payment_date).toDate(),
      paid_amount: item.paid_amount,
    }));

    return database.insert(purchase_payments).values(mappedData);
  },
};
