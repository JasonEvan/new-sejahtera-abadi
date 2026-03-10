import { Tx } from "@/lib/common-types";
import { InsertSalesPayment } from "./sales-payment.types";
import db from "@/lib/drizzle";
import { sales_payments } from "@/drizzle/schema";
import dayjs from "dayjs";

export const salesPaymentRepository = {
  createSalesPayment(data: InsertSalesPayment, tx?: Tx) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      client_id: data.client_id,
      transaction_number: data.transaction_number,
      paid_amount: item.paid_amount,
      payment_date: dayjs(data.transaction_date).toDate(),
      sales_order_id: item.sales_order_id,
    }));

    return database.insert(sales_payments).values(mappedData);
  },
};
