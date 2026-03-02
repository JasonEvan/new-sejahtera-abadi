import { Tx } from "@/lib/common-types";
import { InsertPurchase } from "./purchase.types";
import db from "@/lib/drizzle";
import { purchase_orders } from "@/drizzle/schema";
import dayjs from "dayjs";

export const purchaseOrderRepository = {
  insertPurchaseOrder(data: InsertPurchase, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(purchase_orders)
      .values({
        invoice_number: data.invoice_number,
        invoice_date: dayjs(data.invoice_date).toDate(),
        invoice_value: data.total,
        invoice_discount: data.discount,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: data.total,
        client_id: data.client_id,
      })
      .returning({
        id: purchase_orders.id,
      });
  },
};
