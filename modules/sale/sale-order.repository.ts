import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import { sales_orders } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import dayjs from "dayjs";
import { and, eq, ne, sql } from "drizzle-orm";

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

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return db
      .select({
        id: sales_orders.id,
        invoice_number: sales_orders.invoice_number,
        balance_due: sales_orders.balance_due,
      })
      .from(sales_orders)
      .where(
        and(
          eq(sales_orders.client_id, clientId),
          isPaidOff
            ? eq(sales_orders.balance_due, 0)
            : ne(sales_orders.balance_due, 0),
        ),
      );
  },

  bulkIncPaidAmountAndDecBalanceDue(
    items: { sales_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      items.map(
        (item) => sql`(${item.sales_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${sales_orders} as so
      SET
        paid_amount = so.paid_amount + v.paid_amount,
        balance_due = so.balance_due - v.paid_amount
      FROM (VALUES ${values}) AS v(sales_order_id, paid_amount)
      WHERE so.id = v.sales_order_id
    `;

    return database.execute(query);
  },
};
