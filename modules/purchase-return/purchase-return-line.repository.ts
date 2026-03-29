import { Tx } from "@/lib/common-types";
import db from "@/lib/drizzle";
import { purchase_return_lines } from "@/drizzle/schema";

type EnrichedReturnLine = {
  purchase_order_line_id: number;
  return_qty: number;
  price: number;
};

export const purchaseReturnLineRepository = {
  createPurchaseReturnLine(
    data: EnrichedReturnLine[],
    purchaseReturnId: number,
    tx?: Tx,
  ) {
    const database = tx ?? db;

    const mappedData = data.map((line) => ({
      purchase_return_id: purchaseReturnId,
      price: line.price,
      qty: line.return_qty,
      purchase_order_line_id: line.purchase_order_line_id,
      total_price: line.price * line.return_qty,
    }));

    return database.insert(purchase_return_lines).values(mappedData);
  },
};
