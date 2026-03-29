import { Tx } from "@/lib/common-types";
import {
  EditReceivablesPaymentInput,
  InsertSalesPayment,
} from "./sales-payment.types";
import db from "@/lib/drizzle";
import { sales_orders, sales_payments } from "@/drizzle/schema";
import dayjs from "dayjs";
import { asc, eq } from "drizzle-orm";

export const salesPaymentRepository = {
  createSalesPayment(data: InsertSalesPayment, tx?: Tx) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      client_id: data.client_id,
      transaction_number: data.transaction_number,
      paid_amount: item.paid_amount,
      payment_date: dayjs(data.transaction_date).toDate(),
      sales_order_id: item.sales_order_id,
    }));

    return database.insert(sales_payments).values(mappedData);
  },

  async getEditReceivablesByInvoice(invoiceNumber: string) {
    const [invoice] = await db
      .select({
        id: sales_orders.id,
        invoice_number: sales_orders.invoice_number,
        invoice_value: sales_orders.invoice_value,
        paid_amount: sales_orders.paid_amount,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .where(eq(sales_orders.invoice_number, invoiceNumber));

    if (!invoice) {
      return null;
    }

    const payments = await db
      .select({
        id: sales_payments.id,
        transaction_number: sales_payments.transaction_number,
        payment_date: sales_payments.payment_date,
        paid_amount: sales_payments.paid_amount,
      })
      .from(sales_payments)
      .where(eq(sales_payments.sales_order_id, invoice.id))
      .orderBy(asc(sales_payments.payment_date), asc(sales_payments.id));

    return {
      invoice,
      payments,
    };
  },

  getBySalesOrderId(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .select({
        id: sales_payments.id,
        paid_amount: sales_payments.paid_amount,
      })
      .from(sales_payments)
      .where(eq(sales_payments.sales_order_id, salesOrderId));
  },

  deleteBySalesOrderId(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;

    return database
      .delete(sales_payments)
      .where(eq(sales_payments.sales_order_id, salesOrderId));
  },

  insertEditReceivablesPaymentRows(
    data: {
      client_id: number;
      sales_order_id: number;
      payments: EditReceivablesPaymentInput[];
    },
    tx?: Tx,
  ) {
    const database = tx ?? db;

    const mappedData = data.payments.map((item) => ({
      client_id: data.client_id,
      sales_order_id: data.sales_order_id,
      transaction_number: item.transaction_number,
      payment_date: dayjs(item.payment_date).toDate(),
      paid_amount: item.paid_amount,
    }));

    return database.insert(sales_payments).values(mappedData);
  },
};
