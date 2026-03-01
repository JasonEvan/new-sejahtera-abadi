import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import { sales_orders } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import dayjs from "dayjs";

export const saleOrderRepository = {
  insertSaleOrder(data: InsertSale, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(sales_orders)
      .values({
        client_id: data.client_id,
        invoice_number: data.invoice_number,
        invoice_date: dayjs(data.invoice_date).toDate(),
        invoice_value: data.total,
        invoice_discount: data.discount,
        payment_discount: 0,
        paid_amount: 0,
        balance_due: data.total,
      })
      .returning({
        id: sales_orders.id,
      });
  },
};
