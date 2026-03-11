import {
  clients,
  purchase_order_lines,
  purchase_orders,
  purchase_return_lines,
  purchase_returns,
  sales_order_lines,
  sales_orders,
  sales_return_lines,
  sales_returns,
} from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, sql } from "drizzle-orm";
import { unionAll } from "drizzle-orm/pg-core";

export const reportRepository = {
  getInventoryLedgers(stockId: number) {
    const subquerySales = db
      .select({
        invoice_number: sales_orders.invoice_number,
        invoice_date: sales_orders.invoice_date,
        name: clients.name,
        city: clients.city,
        type: sales_order_lines.type,
        price: sales_order_lines.price,
        qty: sales_order_lines.qty,
        return_qty: sales_return_lines.qty,
        return_date: sales_returns.return_date,
      })
      .from(sales_order_lines)
      .innerJoin(
        sales_orders,
        eq(sales_order_lines.sales_order_id, sales_orders.id),
      )
      .leftJoin(clients, eq(sales_order_lines.client_id, clients.id))
      .leftJoin(
        sales_return_lines,
        eq(sales_order_lines.id, sales_return_lines.sales_order_line_id),
      )
      .leftJoin(
        sales_returns,
        eq(sales_return_lines.sales_return_id, sales_returns.id),
      )
      .where(eq(sales_order_lines.stock_id, stockId));

    const subqueryPurchases = db
      .select({
        invoice_number: purchase_orders.invoice_number,
        invoice_date: purchase_orders.invoice_date,
        name: clients.name,
        city: clients.city,
        type: purchase_order_lines.type,
        price: purchase_order_lines.price,
        qty: purchase_order_lines.qty,
        return_qty: purchase_return_lines.qty,
        return_date: purchase_returns.return_date,
      })
      .from(purchase_order_lines)
      .innerJoin(
        purchase_orders,
        eq(purchase_order_lines.purchase_order_id, purchase_orders.id),
      )
      .leftJoin(clients, eq(purchase_order_lines.client_id, clients.id))
      .leftJoin(
        purchase_return_lines,
        eq(
          purchase_order_lines.id,
          purchase_return_lines.purchase_order_line_id,
        ),
      )
      .leftJoin(
        purchase_returns,
        eq(purchase_return_lines.purchase_return_id, purchase_returns.id),
      )
      .where(eq(purchase_order_lines.stock_id, stockId));

    return unionAll(subquerySales, subqueryPurchases).orderBy(
      asc(sql`invoice_date`),
      asc(sql`invoice_number`),
    );
  },
};
