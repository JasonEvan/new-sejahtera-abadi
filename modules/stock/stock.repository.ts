import { stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, inArray, sql } from "drizzle-orm";
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

  getStartingStock(stockId: number) {
    return db
      .select({ initial_stock: stocks.initial_stock })
      .from(stocks)
      .where(eq(stocks.id, stockId));
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

    const values = sql.join(
      items.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
      sql`, `,
    );

    const query = sql`
      UPDATE ${stocks} AS s
      SET
        ending_stock = s.ending_stock - v.quantity,
        qty_out = s.qty_out + v.quantity
      FROM (VALUES ${values}) AS v(id, quantity)
      WHERE s.id = v.id
    `;

    return database.execute(query);
  },

  bulkIncrementStockAndIncrementQtyIn(
    items: { id: number; quantity: number; product_price?: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      items.map((item) => {
        if (item.product_price !== undefined) {
          return sql`(${item.id}::int, ${item.quantity}::int, ${item.product_price}::int)`;
        } else {
          return sql`(${item.id}::int, ${item.quantity}::int, NULL::int)`;
        }
      }),
      sql`, `,
    );

    const query = sql`
      UPDATE ${stocks} AS s
      SET
        ending_stock = s.ending_stock + v.quantity,
        qty_in = s.qty_in + v.quantity,
        product_price = COALESCE(v.product_price, s.product_price)
      FROM (VALUES ${values}) AS v(id, quantity, product_price)
      WHERE s.id = v.id
    `;

    return database.execute(query);
  },

  bulkIncrementStockAndDecrementQtyOut(
    items: { id: number; quantity: number }[],
    tx?: Tx,
  ) {
    if (items.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      items.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
      sql`, `,
    );

    const query = sql`
      UPDATE ${stocks} AS s
      SET
        ending_stock = s.ending_stock + v.quantity,
        qty_out = s.qty_out - v.quantity
      FROM (VALUES ${values}) AS v(id, quantity)
      WHERE s.id = v.id
    `;

    return database.execute(query);
  },
};
