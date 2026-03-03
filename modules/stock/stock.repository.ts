import { stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, inArray, SQL, sql } from "drizzle-orm";
import { InsertStock } from "./stock.types";
import { Tx } from "@/lib/common-types";

export const stockRepository = {
  getAllStocks() {
    return db
      .select({
        id: stocks.id,
        name: stocks.name,
        product_price: stocks.product_price,
        selling_price: stocks.selling_price,
        unit: stocks.unit,
        capital_cost: stocks.capital_cost,
        initial_stock: stocks.initial_stock,
        ending_stock: stocks.ending_stock,
      })
      .from(stocks)
      .orderBy(asc(stocks.name));
  },

  addStock(data: InsertStock) {
    return db.insert(stocks).values({
      ...data,
      ending_stock: data.initial_stock,
    });
  },

  updateStock(id: number, data: InsertStock) {
    return db.update(stocks).set(data).where(eq(stocks.id, id));
  },

  deleteStock(id: number) {
    return db.delete(stocks).where(eq(stocks.id, id));
  },

  getStocksForUpdate(ids: number[], tx: Tx) {
    if (ids.length === 0) return [];

    return tx
      .select({
        id: stocks.id,
        ending_stock: stocks.ending_stock,
      })
      .from(stocks)
      .where(inArray(stocks.id, ids))
      .orderBy(asc(stocks.id)) // Prevent deadlock by ensuring a consistent order of locking rows
      .for("update"); // Prevent race condition by locking the selected rows until the transaction is complete
  },

  bulkDecrementStockAndIncrementQtyOut(
    items: { id: number; quantity: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const ids = items.map((item) => item.id);

    const decStockChunks = items.map(
      (item) =>
        sql`WHEN ${stocks.id} = ${item.id} THEN ${stocks.ending_stock} - ${item.quantity}`,
    );

    const finalDecStockSql = sql`CASE ${sql.join(decStockChunks, sql` `)} ELSE ${stocks.ending_stock} END`;

    const qtyOutChunks = items.map(
      (item) =>
        sql`WHEN ${stocks.id} = ${item.id} THEN ${stocks.qty_out} + ${item.quantity}`,
    );

    const finalQtyOutSql = sql`CASE ${sql.join(qtyOutChunks, sql` `)} ELSE ${stocks.qty_out} END`;

    return database
      .update(stocks)
      .set({ ending_stock: finalDecStockSql, qty_out: finalQtyOutSql })
      .where(inArray(stocks.id, ids));
  },

  bulkIncrementStockAndIncrementQtyIn(
    items: { id: number; quantity: number; product_price?: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const ids = items.map((item) => item.id);

    const incStockChunks = items.map(
      (item) =>
        sql`WHEN ${stocks.id} = ${item.id} THEN ${stocks.ending_stock} + ${item.quantity}`,
    );

    const finalIncStockSql = sql`CASE ${sql.join(incStockChunks, sql` `)} ELSE ${stocks.ending_stock} END`;

    const qtyInChunks = items.map(
      (item) =>
        sql`WHEN ${stocks.id} = ${item.id} THEN ${stocks.qty_in} + ${item.quantity}`,
    );

    const finalQtyInSql = sql`CASE ${sql.join(qtyInChunks, sql` `)} ELSE ${stocks.qty_in} END`;

    const updatePayload: {
      ending_stock: SQL;
      qty_in: SQL;
      product_price?: SQL;
    } = {
      ending_stock: finalIncStockSql,
      qty_in: finalQtyInSql,
    };

    const itemsWithPrice = items.filter(
      (item) => item.product_price !== undefined,
    );

    if (itemsWithPrice.length > 0) {
      const priceChunks = itemsWithPrice.map(
        (item) =>
          sql`WHEN ${stocks.id} = ${item.id} THEN ${item.product_price}`,
      );

      updatePayload.product_price = sql`CASE ${sql.join(priceChunks, sql` `)} ELSE ${stocks.product_price} END`;
    }

    return database
      .update(stocks)
      .set(updatePayload)
      .where(inArray(stocks.id, ids));
  },
};
