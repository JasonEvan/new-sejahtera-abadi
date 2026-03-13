import { Tx } from "@/lib/common-types";
import db from "@/lib/drizzle";
import { sales_return_lines } from "@/drizzle/schema";

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
};
