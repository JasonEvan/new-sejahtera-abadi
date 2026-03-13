import { Tx } from "@/lib/common-types";
import { InsertSale } from "./sale.types";
import db from "@/lib/drizzle";
import { sales_order_lines } from "@/drizzle/schema";
import { eq, inArray, sql, asc } from "drizzle-orm";

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

  getStockIds(ids: number[]) {
    return db
      .select({
        id: sales_order_lines.id,
        stock_id: sales_order_lines.stock_id,
      })
      .from(sales_order_lines)
      .where(inArray(sales_order_lines.id, ids))
      .orderBy(asc(sales_order_lines.stock_id));
  },

  getLineDetails(ids: number[], tx?: Tx) {
    const database = tx ?? db;
    return database
      .select({
        id: sales_order_lines.id,
        stock_id: sales_order_lines.stock_id,
        price: sales_order_lines.price,
      })
      .from(sales_order_lines)
      .where(inArray(sales_order_lines.id, ids));
  },

  async getSumTotalPriceByOrderId(
    salesOrderId: number,
    tx?: Tx,
  ): Promise<number> {
    const database = tx ?? db;
    const [result] = await database
      .select({
        total: sql<number>`COALESCE(SUM(${sales_order_lines.total_price}), 0)`,
      })
      .from(sales_order_lines)
      .where(eq(sales_order_lines.sales_order_id, salesOrderId));
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
      UPDATE ${sales_order_lines} AS sol
      SET
        qty = sol.qty - v.quantity,
        total_price = (sol.qty - v.quantity) * sol.price
      FROM (VALUES ${values}) AS v(id, quantity)
      WHERE sol.id = v.id
    `;

    return database.execute(query);
  },
};
