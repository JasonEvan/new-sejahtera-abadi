import db from "@/lib/drizzle";
import { InsertSalesPayment } from "./sales-payment.types";
import { salesPaymentRepository } from "./sales-payment.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { clientRepository } from "../client/client.repository";

export const salesPaymentService = {
  createSalesPayment(data: InsertSalesPayment) {
    return db.transaction(async (tx) => {
      const totalPayments = data.cart.reduce(
        (acc, curr) => acc + curr.paid_amount,
        0,
      );

      await salesPaymentRepository.createSalesPayment(data, tx);
      await saleOrderRepository.bulkIncPaidAmountAndDecBalanceDue(
        data.cart,
        tx,
      );
      await clientRepository.decReceivableBalance(
        data.client_id,
        totalPayments,
        tx,
      );
    });
  },
};
