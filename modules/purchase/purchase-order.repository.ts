import { Tx } from "@/lib/common-types";
import { InsertPurchase } from "./purchase.types";
import db from "@/lib/drizzle";
import { purchase_orders } from "@/drizzle/schema";
import dayjs from "dayjs";
import { and, eq, ne, sql } from "drizzle-orm";

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

  getOrdersMenu(clientId: number, isPaidOff: boolean) {
    return db
      .select({
        id: purchase_orders.id,
        invoice_number: purchase_orders.invoice_number,
        balance_due: purchase_orders.balance_due,
      })
      .from(purchase_orders)
      .where(
        and(
          eq(purchase_orders.client_id, clientId),
          isPaidOff
            ? eq(purchase_orders.balance_due, 0)
            : ne(purchase_orders.balance_due, 0),
        ),
      );
  },

  bulkIncPaidAmountAndDecBalanceDue(
    items: { purchase_order_id: number; paid_amount: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      items.map(
        (item) =>
          sql`(${item.purchase_order_id}::int, ${item.paid_amount}::int)`,
      ),
      sql`, `,
    );

    const query = sql`
      UPDATE ${purchase_orders} as po
      SET
        paid_amount = po.paid_amount + v.paid_amount,
        balance_due = po.balance_due - v.paid_amount
      FROM (VALUES ${values}) AS v(purchase_order_id, paid_amount)
      WHERE po.id = v.purchase_order_id
    `;

    return database.execute(query);
  },
};
