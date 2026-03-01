import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import db from "@/lib/drizzle";
import { sales_order_lines } from "@/drizzle/schema";

export const saleOrderLineRepository = {
  insertSaleOrderLine(data: InsertSale, sales_order_id: number, tx?: Tx) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      sales_order_id,
      client_id: data.client_id,
      stock_id: item.stock_id,
      price: item.selling_price,
      qty: item.quantity,
      total_price: item.subtotal,
      salesperson_id: data.salesman_id,
    }));

    return database.insert(sales_order_lines).values(mappedData);
  },
};
