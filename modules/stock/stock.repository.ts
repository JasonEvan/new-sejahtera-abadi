import { stocks } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc } from "drizzle-orm";
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
};
