import { Tx } from "@/lib/common-types";
import db from "@/lib/drizzle";
import { purchase_order_lines, purchase_return_lines } from "@/drizzle/schema";
import { eq, inArray } from "drizzle-orm";

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

  getByPurchaseReturnIds(purchaseReturnIds: number[], tx?: Tx) {
    if (purchaseReturnIds.length === 0) return [];

    const database = tx ?? db;

    return database
      .select({
        purchase_order_line_id: purchase_return_lines.purchase_order_line_id,
        return_qty: purchase_return_lines.qty,
        stock_id: purchase_order_lines.stock_id,
      })
      .from(purchase_return_lines)
      .innerJoin(
        purchase_order_lines,
        eq(
          purchase_return_lines.purchase_order_line_id,
          purchase_order_lines.id,
        ),
      )
      .where(
        inArray(purchase_return_lines.purchase_return_id, purchaseReturnIds),
      );
  },

  deleteByPurchaseReturnIds(purchaseReturnIds: number[], tx?: Tx) {
    if (purchaseReturnIds.length === 0) return;

    const database = tx ?? db;

    return database
      .delete(purchase_return_lines)
      .where(
        inArray(purchase_return_lines.purchase_return_id, purchaseReturnIds),
      );
  },
};
