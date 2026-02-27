import { stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq } from "drizzle-orm";
import { InsertStock } from "./stock.types";

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
};
