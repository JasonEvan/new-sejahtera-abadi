import { Tx } from "@/lib/common-types";
import { InsertPurchasePayment } from "./purchase-payment.types";
import db from "@/lib/drizzle";
import { purchase_payments } from "@/drizzle/schema";
import dayjs from "dayjs";

export const purchasePaymentRepository = {
  createPurchasePayment(data: InsertPurchasePayment, tx?: Tx) {
    const database = tx ?? db;

    const mappedData = data.cart.map((item) => ({
      client_id: data.client_id,
      paid_amount: item.paid_amount,
      payment_date: dayjs(data.transaction_date).toDate(),
      purchase_order_id: item.purchase_order_id,
      transaction_number: data.transaction_number,
    }));

    return database.insert(purchase_payments).values(mappedData);
  },
};
