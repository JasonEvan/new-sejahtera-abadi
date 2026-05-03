import { Tx } from "@/lib/common-types";
import {
  EditPurchaseReturnDetail,
  InsertPurchaseReturn,
} from "./purchase-return.types";
import db from "@/lib/drizzle";
import {
  purchase_order_lines,
  purchase_orders,
  purchase_return_lines,
  purchase_returns,
  stocks,
} from "@/drizzle/schema";
import dayjs from "dayjs";
import { and, desc, eq, sql } from "drizzle-orm";

export const purchaseReturnRepository = {
  createPurchaseReturn(data: InsertPurchaseReturn, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(purchase_returns)
      .values({
        purchase_order_id: data.purchase_order_id,
        client_id: data.client_id,
        return_date: dayjs(data.return_date).toDate(),
      })
      .returning({ id: purchase_returns.id });
  },

  async hasReturnForPurchaseOrder(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    const [row] = await database
      .select({ id: purchase_returns.id })
      .from(purchase_returns)
      .where(eq(purchase_returns.purchase_order_id, purchaseOrderId))
      .limit(1);

    return !!row;
  },

  getById(id: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select()
      .from(purchase_returns)
      .where(eq(purchase_returns.id, id))
      .limit(1);
  },

  deleteById(id: number, tx?: Tx) {
    const database = tx ?? db;

    return database.delete(purchase_returns).where(eq(purchase_returns.id, id));
  },

  getReturnHistoryByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({
        id: purchase_returns.id,
        return_date: purchase_returns.return_date,
      })
      .from(purchase_returns)
      .where(eq(purchase_returns.purchase_order_id, purchaseOrderId))
      .orderBy(desc(purchase_returns.return_date));
  },

  getUnpaidReturnedInvoices() {
    return db
      .select({
        id: purchase_orders.id,
        invoice_number: purchase_orders.invoice_number,
      })
      .from(purchase_orders)
      .innerJoin(
        purchase_returns,
        eq(purchase_orders.id, purchase_returns.purchase_order_id),
      )
      .where(eq(purchase_orders.paid_amount, 0))
      .groupBy(purchase_orders.id, purchase_orders.invoice_number)
      .orderBy(desc(purchase_orders.id));
  },

  async getEditPurchaseReturnDetailById(
    returnId: number,
  ): Promise<EditPurchaseReturnDetail | null> {
    const [header] = await db
      .select({
        purchase_return_id: purchase_returns.id,
        purchase_order_id: purchase_orders.id,
        client: purchase_orders.client_id,
        invoice_number: purchase_orders.invoice_number,
        return_date: purchase_returns.return_date,
        discount: purchase_orders.invoice_discount,
        total: purchase_orders.invoice_value,
      })
      .from(purchase_returns)
      .innerJoin(
        purchase_orders,
        eq(purchase_returns.purchase_order_id, purchase_orders.id),
      )
      .where(eq(purchase_returns.id, returnId))
      .limit(1);

    if (!header) return null;

    const returnLines = await db
      .select({
        id: purchase_order_lines.id,
        stock_id: purchase_order_lines.stock_id,
        name: stocks.name,
        price: purchase_order_lines.price,
        qty: purchase_order_lines.qty,
        this_return_qty: sql<number>`COALESCE(${purchase_return_lines.qty}, 0)`.mapWith(Number),
        all_return_qty: sql<number>`(SELECT COALESCE(SUM(qty), 0) FROM ${purchase_return_lines} WHERE purchase_order_line_id = ${purchase_order_lines.id})`.mapWith(Number),
      })
      .from(purchase_order_lines)
      .leftJoin(
        purchase_return_lines,
        and(
          eq(purchase_return_lines.purchase_order_line_id, purchase_order_lines.id),
          eq(purchase_return_lines.purchase_return_id, returnId),
        ),
      )
      .leftJoin(stocks, eq(purchase_order_lines.stock_id, stocks.id))
      .where(eq(purchase_order_lines.purchase_order_id, header.purchase_order_id));

    const lines = returnLines.map((line) => {
      const original_qty = line.qty + line.all_return_qty;
      const subtotal = line.price * line.qty;

      return {
        id: line.id,
        stock_id: line.stock_id ?? 0,
        name: line.name ?? "",
        price: line.price,
        original_qty,
        qty: line.qty,
        return_qty: line.this_return_qty,
        subtotal,
      };
    });

    const invoice_value = lines.reduce(
      (acc, line) => acc + line.price * line.original_qty,
      0,
    );
    const total = header.total;

    return {
      transaction_information: {
        purchase_return_id: header.purchase_return_id,
        purchase_order_id: header.purchase_order_id,
        client: header.client,
        invoice_number: header.invoice_number,
        return_date: dayjs(header.return_date).toISOString(),
      },
      lines,
      meta: {
        invoice_value,
        discount: header.discount,
        total,
      },
    };
  },
};
