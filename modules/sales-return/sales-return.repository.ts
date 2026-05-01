import { Tx } from "@/lib/common-types";
import { EditSaleReturnDetail, InsertSaleReturn } from "./sales-return.types";
import db from "@/lib/drizzle";
import {
  sales_order_lines,
  sales_orders,
  sales_return_lines,
  sales_returns,
  stocks,
} from "@/drizzle/schema";
import dayjs from "dayjs";
import { and, desc, eq, sql } from "drizzle-orm";

export const salesReturnRepository = {
  createSalesReturn(data: InsertSaleReturn, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(sales_returns)
      .values({
        sales_order_id: data.sales_order_id,
        client_id: data.client_id,
        return_date: dayjs(data.return_date).toDate(),
      })
      .returning({ id: sales_returns.id });
  },

  async hasReturnForSalesOrder(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    const [row] = await database
      .select({ id: sales_returns.id })
      .from(sales_returns)
      .where(eq(sales_returns.sales_order_id, salesOrderId))
      .limit(1);

    return !!row;
  },

  getById(id: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select()
      .from(sales_returns)
      .where(eq(sales_returns.id, id))
      .limit(1);
  },

  deleteById(id: number, tx?: Tx) {
    const database = tx ?? db;

    return database.delete(sales_returns).where(eq(sales_returns.id, id));
  },

  getUnpaidReturnedInvoices() {
    return db
      .select({
        id: sales_orders.id,
        invoice_number: sales_orders.invoice_number,
      })
      .from(sales_orders)
      .innerJoin(
        sales_returns,
        eq(sales_orders.id, sales_returns.sales_order_id),
      )
      .where(eq(sales_orders.paid_amount, 0))
      .groupBy(sales_orders.id, sales_orders.invoice_number)
      .orderBy(desc(sales_orders.id));
  },

  async getEditSaleReturnDetailById(
    returnId: number,
  ): Promise<EditSaleReturnDetail | null> {
    const [header] = await db
      .select({
        sales_return_id: sales_returns.id,
        sales_order_id: sales_orders.id,
        client: sales_orders.client_id,
        invoice_number: sales_orders.invoice_number,
        return_date: sales_returns.return_date,
        discount: sales_orders.invoice_discount,
        total: sales_orders.invoice_value,
      })
      .from(sales_returns)
      .innerJoin(
        sales_orders,
        eq(sales_returns.sales_order_id, sales_orders.id),
      )
      .where(eq(sales_returns.id, returnId))
      .limit(1);

    if (!header) return null;

    const returnLines = await db
      .select({
        id: sales_order_lines.id,
        stock_id: sales_order_lines.stock_id,
        name: stocks.name,
        price: sales_order_lines.price,
        qty: sales_order_lines.qty,
        this_return_qty: sql<number>`COALESCE(${sales_return_lines.qty}, 0)`.mapWith(Number),
        all_return_qty: sql<number>`(SELECT COALESCE(SUM(qty), 0) FROM ${sales_return_lines} WHERE sales_order_line_id = ${sales_order_lines.id})`.mapWith(Number),
      })
      .from(sales_order_lines)
      .leftJoin(
        sales_return_lines,
        and(
          eq(sales_return_lines.sales_order_line_id, sales_order_lines.id),
          eq(sales_return_lines.sales_return_id, returnId),
        ),
      )
      .leftJoin(stocks, eq(sales_order_lines.stock_id, stocks.id))
      .where(eq(sales_order_lines.sales_order_id, header.sales_order_id));

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

    return {
      transaction_information: {
        sales_return_id: header.sales_return_id,
        sales_order_id: header.sales_order_id,
        client: header.client,
        invoice_number: header.invoice_number,
        return_date: dayjs(header.return_date).toISOString(),
      },
      lines,
      meta: {
        invoice_value,
        discount: header.discount,
        total: header.total,
      },
    };
  },

  getReturnHistoryBySalesOrderId(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({
        id: sales_returns.id,
        return_date: sales_returns.return_date,
      })
      .from(sales_returns)
      .where(eq(sales_returns.sales_order_id, salesOrderId))
      .orderBy(desc(sales_returns.return_date));
  },
};
