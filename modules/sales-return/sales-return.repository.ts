import { Tx } from "@/lib/common-types";
import { InsertSaleReturn } from "./sales-return.types";
import db from "@/lib/drizzle";
import { sales_returns } from "@/drizzle/schema";
import dayjs from "dayjs";
import { eq } from "drizzle-orm";

export const salesReturnRepository = {
  createSalesReturn(data: InsertSaleReturn, tx?: Tx) {
    const database = tx ?? db;
    return database
      .insert(sales_returns)
      .values({
        sales_order_id: data.sales_order_id,
        client_id: data.client_id,
        return_date: dayjs(data.return_date).toDate(),
      })
      .returning({ id: sales_returns.id });
  },

  async hasReturnForSalesOrder(salesOrderId: number, tx?: Tx) {
    const database = tx ?? db;
    const [row] = await database
      .select({ id: sales_returns.id })
      .from(sales_returns)
      .where(eq(sales_returns.sales_order_id, salesOrderId))
      .limit(1);

    return !!row;
  },
};
