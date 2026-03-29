import { Tx } from "@/lib/common-types";
import { InsertPurchase } from "./purchase.types";
import db from "@/lib/drizzle";
import { purchase_order_lines } from "@/drizzle/schema";
import { asc, eq, inArray, sql } from "drizzle-orm";

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

  insertPurchaseOrderLineForEdit(
    data: {
      client_id: number;
      cart: {
        stock_id: number;
        quantity: number;
        product_price: number;
        subtotal: number;
      }[];
    },
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

  getByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({
        id: purchase_order_lines.id,
        stock_id: purchase_order_lines.stock_id,
        qty: purchase_order_lines.qty,
      })
      .from(purchase_order_lines)
      .where(eq(purchase_order_lines.purchase_order_id, purchaseOrderId))
      .orderBy(asc(purchase_order_lines.stock_id));
  },

  deleteByPurchaseOrderId(purchaseOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .delete(purchase_order_lines)
      .where(eq(purchase_order_lines.purchase_order_id, purchaseOrderId));
  },

  getStockIds(ids: number[]) {
    return db
      .select({
        id: purchase_order_lines.id,
        stock_id: purchase_order_lines.stock_id,
      })
      .from(purchase_order_lines)
      .where(inArray(purchase_order_lines.id, ids))
      .orderBy(asc(purchase_order_lines.stock_id));
  },

  getLineDetails(ids: number[], tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({
        id: purchase_order_lines.id,
        stock_id: purchase_order_lines.stock_id,
        price: purchase_order_lines.price,
      })
      .from(purchase_order_lines)
      .where(inArray(purchase_order_lines.id, ids));
  },

  async getSumTotalPriceByOrderId(
    purchaseOrderId: number,
    tx?: Tx,
  ): Promise<number> {
    const database = tx ?? db;
    const [result] = await database
      .select({
        total: sql<number>`COALESCE(SUM(${purchase_order_lines.total_price}), 0)`,
      })
      .from(purchase_order_lines)
      .where(eq(purchase_order_lines.purchase_order_id, purchaseOrderId));
    return Number(result?.total ?? 0);
  },

  bulkDecrementQuantity(data: { id: number; quantity: number }[], tx?: Tx) {
    if (data.length === 0) return;

    const database = tx ?? db;

    const values = sql.join(
      data.map((item) => sql`(${item.id}::int, ${item.quantity}::int)`),
      sql`, `,
    );

    const query = sql`
      UPDATE ${purchase_order_lines} AS pol
      SET
        qty = pol.qty - v.quantity,
        total_price = (pol.qty - v.quantity) * pol.price
      FROM (VALUES ${values}) AS v(id, quantity)
      WHERE pol.id = v.id
    `;

    return database.execute(query);
  },
};
