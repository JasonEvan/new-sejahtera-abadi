import { Tx } from "@/lib/common-types";
import { InsertPurchaseReturn } from "./purchase-return.types";
import db from "@/lib/drizzle";
import { purchase_returns } from "@/drizzle/schema";
import dayjs from "dayjs";

export const purchaseReturnRepository = {
  createPurchaseReturn(data: InsertPurchaseReturn, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(purchase_returns)
      .values({
        purchase_order_id: data.purchase_order_id,
        client_id: data.client_id,
        return_date: dayjs(data.return_date).toDate(),
      })
      .returning({ id: purchase_returns.id });
  },
};
