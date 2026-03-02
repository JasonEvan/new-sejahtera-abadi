import { Tx } from "@/lib/common-types";
import { InsertPurchase } from "./purchase.types";
import db from "@/lib/drizzle";
import { purchase_order_lines } from "@/drizzle/schema";

export const purchaseOrderLineRepository = {
  insertPurchaseOrderLine(
    data: InsertPurchase,
    purchase_order_id: number,
    tx?: Tx,
  ) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      purchase_order_id,
      client_id: data.client_id,
      stock_id: item.stock_id,
      price: item.product_price,
      qty: item.quantity,
      total_price: item.subtotal,
    }));

    return database.insert(purchase_order_lines).values(mappedData);
  },
};
