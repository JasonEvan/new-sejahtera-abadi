import { Tx } from "@/lib/common-types";
import { InsertSaleReturn } from "./sales-return.types";
import db from "@/lib/drizzle";
import { sales_returns } from "@/drizzle/schema";
import dayjs from "dayjs";

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
};
