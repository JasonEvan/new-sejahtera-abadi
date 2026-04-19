import { stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, inArray, sql } from "drizzle-orm";
import { InsertStock } from "./stock.types";
import { Tx } from "@/lib/common-types";

type StockQtyItem = { id: number; quantity: number };
type StockQtyPriceItem = { id: number; quantity: number; product_price?: number };

function aggregateStockItems(items: StockQtyItem[]): StockQtyItem[] {
  const aggregated = new Map<number, number>();

  for (const item of items) {
    aggregated.set(item.id, (aggregated.get(item.id) ?? 0) + item.quantity);
  }

  return Array.from(aggregated, ([id, quantity]) => ({ id, quantity }));
}

function aggregateStockItemsWithPrice(
  items: StockQtyPriceItem[],
): StockQtyPriceItem[] {
  const aggregated = new Map<number, { quantity: number; product_price?: number }>();

  for (const item of items) {
    const current = aggregated.get(item.id);

    if (!current) {
      aggregated.set(item.id, {
        quantity: item.quantity,
        product_price: item.product_price,
      });
      continue;
    }

    current.quantity += item.quantity;

    if (item.product_price !== undefined) {
      current.product_price = item.product_price;
    }
  }

  return Array.from(aggregated, ([id, value]) => ({
    id,
    quantity: value.quantity,
    product_price: value.product_price,
  }));
}

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
    const aggregatedItems = aggregateStockItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
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
    const aggregatedItems = aggregateStockItemsWithPrice(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map((item) => {
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
    const aggregatedItems = aggregateStockItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
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

  bulkDecrementStockAndDecrementQtyIn(
    items: { id: number; quantity: number }[],
    tx?: Tx,
  ) {
    const aggregatedItems = aggregateStockItems(items);

    if (aggregatedItems.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      aggregatedItems.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
      sql`, `,
    );

    const query = sql`
      UPDATE ${stocks} AS s
      SET
        ending_stock = s.ending_stock - v.quantity,
        qty_in = s.qty_in - v.quantity
      FROM (VALUES ${values}) AS v(id, quantity)
      WHERE s.id = v.id
    `;

    return database.execute(query);
  },
};
