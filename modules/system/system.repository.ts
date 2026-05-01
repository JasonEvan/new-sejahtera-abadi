import {
  purchase_order_lines,
  purchase_orders,
  purchase_payments,
  purchase_return_lines,
  purchase_returns,
  sales_order_lines,
  sales_orders,
  sales_payments,
  sales_return_lines,
  sales_returns,
  stocks,
} from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { and, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { Tx } from "@/lib/common-types";

export const systemRepository = {
  async getAllStockIds(tx?: Tx) {
    const database = tx ?? db;
    return database.select({ id: stocks.id }).from(stocks);
  },

  async getDeletedStockMovements(
    salesOrderIds: number[],
    purchaseOrderIds: number[],
    tx: Tx,
  ) {
    const movements = new Map<number, { qtyIn: number; qtyOut: number }>();

    const getEntry = (stockId: number) => {
      if (!movements.has(stockId)) {
        movements.set(stockId, { qtyIn: 0, qtyOut: 0 });
      }
      return movements.get(stockId)!;
    };

    if (salesOrderIds.length > 0) {
      // 1. Sales (qtyOut)
      const sales = await tx
        .select({
          stockId: sales_order_lines.stock_id,
          totalQty: sql<number>`SUM(${sales_order_lines.qty})`.mapWith(Number),
        })
        .from(sales_order_lines)
        .where(inArray(sales_order_lines.sales_order_id, salesOrderIds))
        .groupBy(sales_order_lines.stock_id);

      sales.forEach((s) => {
        if (s.stockId) getEntry(s.stockId).qtyOut += s.totalQty;
      });

      // 2. Sales Returns (qtyIn)
      const salesReturns = await tx
        .select({
          stockId: sales_order_lines.stock_id,
          totalQty: sql<number>`SUM(${sales_return_lines.qty})`.mapWith(Number),
        })
        .from(sales_return_lines)
        .innerJoin(
          sales_order_lines,
          eq(sales_return_lines.sales_order_line_id, sales_order_lines.id),
        )
        .where(inArray(sales_order_lines.sales_order_id, salesOrderIds))
        .groupBy(sales_order_lines.stock_id);

      salesReturns.forEach((sr) => {
        if (sr.stockId) getEntry(sr.stockId).qtyIn += sr.totalQty;
      });
    }

    if (purchaseOrderIds.length > 0) {
      // 3. Purchases (qtyIn)
      const purchases = await tx
        .select({
          stockId: purchase_order_lines.stock_id,
          totalQty: sql<number>`SUM(${purchase_order_lines.qty})`.mapWith(
            Number,
          ),
        })
        .from(purchase_order_lines)
        .where(
          inArray(purchase_order_lines.purchase_order_id, purchaseOrderIds),
        )
        .groupBy(purchase_order_lines.stock_id);

      purchases.forEach((p) => {
        if (p.stockId) getEntry(p.stockId).qtyIn += p.totalQty;
      });

      // 4. Purchase Returns (qtyOut)
      const purchaseReturns = await tx
        .select({
          stockId: purchase_order_lines.stock_id,
          totalQty: sql<number>`SUM(${purchase_return_lines.qty})`.mapWith(
            Number,
          ),
        })
        .from(purchase_return_lines)
        .innerJoin(
          purchase_order_lines,
          eq(
            purchase_return_lines.purchase_order_line_id,
            purchase_order_lines.id,
          ),
        )
        .where(
          inArray(purchase_order_lines.purchase_order_id, purchaseOrderIds),
        )
        .groupBy(purchase_order_lines.stock_id);

      purchaseReturns.forEach((pr) => {
        if (pr.stockId) getEntry(pr.stockId).qtyOut += pr.totalQty;
      });
    }

    return Array.from(movements, ([stockId, { qtyIn, qtyOut }]) => ({
      stockId,
      qtyIn,
      qtyOut,
    }));
  },

  async shiftStockBalances(
    stockId: number,
    deletedQtyIn: number,
    deletedQtyOut: number,
    tx: Tx,
  ) {
    return tx
      .update(stocks)
      .set({
        initial_stock: sql`${stocks.initial_stock} + ${deletedQtyIn} - ${deletedQtyOut}`,
        qty_in: sql`${stocks.qty_in} - ${deletedQtyIn}`,
        qty_out: sql`${stocks.qty_out} - ${deletedQtyOut}`,
      })
      .where(eq(stocks.id, stockId));
  },

  async getPaidSalesOrders(startDate: Date, endDate: Date, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({ id: sales_orders.id })
      .from(sales_orders)
      .where(
        and(
          gte(sales_orders.invoice_date, startDate),
          lte(sales_orders.invoice_date, endDate),
          eq(sales_orders.balance_due, 0),
        ),
      );
  },

  async getPaidPurchaseOrders(startDate: Date, endDate: Date, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({ id: purchase_orders.id })
      .from(purchase_orders)
      .where(
        and(
          gte(purchase_orders.invoice_date, startDate),
          lte(purchase_orders.invoice_date, endDate),
          eq(purchase_orders.balance_due, 0),
        ),
      );
  },

  async deleteSalesOrderCascading(salesOrderId: number, tx: Tx) {
    // 1. Delete sales_return_lines
    await tx.execute(sql`
      DELETE FROM ${sales_return_lines} 
      WHERE sales_return_id IN (
        SELECT id FROM ${sales_returns} WHERE sales_order_id = ${salesOrderId}
      )
    `);

    // 2. Delete sales_returns
    await tx
      .delete(sales_returns)
      .where(eq(sales_returns.sales_order_id, salesOrderId));

    // 3. Delete sales_payments
    await tx
      .delete(sales_payments)
      .where(eq(sales_payments.sales_order_id, salesOrderId));

    // 4. Delete sales_order_lines
    await tx
      .delete(sales_order_lines)
      .where(eq(sales_order_lines.sales_order_id, salesOrderId));

    // 5. Delete sales_orders
    await tx.delete(sales_orders).where(eq(sales_orders.id, salesOrderId));
  },

  async deletePurchaseOrderCascading(purchaseOrderId: number, tx: Tx) {
    // 1. Delete purchase_return_lines
    await tx.execute(sql`
      DELETE FROM ${purchase_return_lines} 
      WHERE purchase_return_id IN (
        SELECT id FROM ${purchase_returns} WHERE purchase_order_id = ${purchaseOrderId}
      )
    `);

    // 2. Delete purchase_returns
    await tx
      .delete(purchase_returns)
      .where(eq(purchase_returns.purchase_order_id, purchaseOrderId));

    // 3. Delete purchase_payments
    await tx
      .delete(purchase_payments)
      .where(eq(purchase_payments.purchase_order_id, purchaseOrderId));

    // 4. Delete purchase_order_lines
    await tx
      .delete(purchase_order_lines)
      .where(eq(purchase_order_lines.purchase_order_id, purchaseOrderId));

    // 5. Delete purchase_orders
    await tx
      .delete(purchase_orders)
      .where(eq(purchase_orders.id, purchaseOrderId));
  },
};
