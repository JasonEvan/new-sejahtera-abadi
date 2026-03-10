import db from "@/lib/drizzle";
import { InsertPurchasePayment } from "./purchase-payment.types";
import { purchasePaymentRepository } from "./purchase-payment.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { clientRepository } from "../client/client.repository";

export const purchasePaymentService = {
  createPurchasePayment(data: InsertPurchasePayment) {
    return db.transaction(async (tx) => {
      const totalPayments = data.cart.reduce(
        (acc, curr) => acc + curr.paid_amount,
        0,
      );

      await purchasePaymentRepository.createPurchasePayment(data, tx);
      await purchaseOrderRepository.bulkIncPaidAmountAndDecBalanceDue(
        data.cart,
        tx,
      );
      await clientRepository.decPayableBalance(
        data.client_id,
        totalPayments,
        tx,
      );
    });
  },
};
