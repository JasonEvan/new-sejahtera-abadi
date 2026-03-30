import { Tx } from "@/lib/common-types";
import db from "@/lib/drizzle";
import { sales_order_lines, sales_return_lines } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

type EnrichedReturnLine = {
  sales_order_line_id: number;
  return_qty: number;
  price: number;
};

export const salesReturnLineRepository = {
  createSalesReturnLine(
    data: EnrichedReturnLine[],
    salesReturnId: number,
    tx?: Tx,
  ) {
    const database = tx ?? db;

    const mappedData = data.map((line) => ({
      sales_return_id: salesReturnId,
      price: line.price,
      qty: line.return_qty,
      sales_order_line_id: line.sales_order_line_id,
      total_price: line.price * line.return_qty,
    }));

    return database.insert(sales_return_lines).values(mappedData);
  },

  getBySalesReturnIds(salesReturnIds: number[], tx?: Tx) {
    if (salesReturnIds.length === 0) return [];

    const database = tx ?? db;

    return database
      .select({
        sales_order_line_id: sales_return_lines.sales_order_line_id,
        return_qty: sales_return_lines.qty,
        stock_id: sales_order_lines.stock_id,
      })
      .from(sales_return_lines)
      .innerJoin(
        sales_order_lines,
        eq(sales_return_lines.sales_order_line_id, sales_order_lines.id),
      )
      .where(inArray(sales_return_lines.sales_return_id, salesReturnIds));
  },

  deleteBySalesReturnIds(salesReturnIds: number[], tx?: Tx) {
    if (salesReturnIds.length === 0) return;

    const database = tx ?? db;

    return database
      .delete(sales_return_lines)
      .where(inArray(sales_return_lines.sales_return_id, salesReturnIds));
  },
};
