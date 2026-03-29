import db from "@/lib/drizzle";
import {
  DeleteEditPayablesByInvoiceInput,
  InsertPurchasePayment,
  UpdateEditPayablesByInvoiceInput,
} from "./purchase-payment.types";
import { purchasePaymentRepository } from "./purchase-payment.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { clientRepository } from "../client/client.repository";
import dayjs from "dayjs";
import { AppError } from "@/lib/errors";

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

  async getEditPayablesByInvoice(invoiceNumber: string) {
    const result =
      await purchasePaymentRepository.getEditPayablesByInvoice(invoiceNumber);

    if (!result) {
      return null;
    }

    return {
      invoice_number: result.invoice.invoice_number,
      invoice_value: result.invoice.invoice_value,
      paid_amount: result.invoice.paid_amount,
      balance_due: result.invoice.balance_due,
      payments: result.payments.map((payment) => ({
        id: payment.id,
        transaction_number: payment.transaction_number,
        payment_date: dayjs(payment.payment_date).format("YYYY-MM-DD"),
        paid_amount: payment.paid_amount,
      })),
    };
  },

  deleteEditPayablesByInvoice(data: DeleteEditPayablesByInvoiceInput) {
    return db.transaction(async (tx) => {
      const order = await purchaseOrderRepository.getByInvoiceNumber(
        data.invoice_number,
        tx,
      );

      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      const existingPayments =
        await purchasePaymentRepository.getByPurchaseOrderId(order.id, tx);

      const oldTotalPaidAmount = existingPayments.reduce(
        (total, item) => total + item.paid_amount,
        0,
      );

      await purchasePaymentRepository.deleteByPurchaseOrderId(order.id, tx);

      if (oldTotalPaidAmount > 0) {
        await purchaseOrderRepository.updatePaidAndBalanceDue(
          order.id,
          {
            paid_amount: Math.max(order.paid_amount - oldTotalPaidAmount, 0),
            balance_due: order.balance_due + oldTotalPaidAmount,
          },
          tx,
        );

        await clientRepository.incPayableBalance(
          order.client_id,
          oldTotalPaidAmount,
          tx,
        );
      }

      return {
        message: "Payments deleted successfully",
      };
    });
  },

  updateEditPayablesByInvoice(data: UpdateEditPayablesByInvoiceInput) {
    return db.transaction(async (tx) => {
      const order = await purchaseOrderRepository.getByInvoiceNumber(
        data.invoice_number,
        tx,
      );

      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      const existingPayments =
        await purchasePaymentRepository.getByPurchaseOrderId(order.id, tx);

      const oldTotalPaidAmount = existingPayments.reduce(
        (total, item) => total + item.paid_amount,
        0,
      );

      const newTotalPaidAmount = data.payments.reduce(
        (total, item) => total + item.paid_amount,
        0,
      );

      if (newTotalPaidAmount > order.invoice_value) {
        throw new AppError(
          "Total paid amount cannot exceed invoice value",
          400,
        );
      }

      await purchasePaymentRepository.deleteByPurchaseOrderId(order.id, tx);

      await purchasePaymentRepository.insertEditPayablesPaymentRows(
        {
          client_id: order.client_id,
          purchase_order_id: order.id,
          payments: data.payments,
        },
        tx,
      );

      await purchaseOrderRepository.updatePaidAndBalanceDue(
        order.id,
        {
          paid_amount: newTotalPaidAmount,
          balance_due: order.invoice_value - newTotalPaidAmount,
        },
        tx,
      );

      const payableBalanceDelta = newTotalPaidAmount - oldTotalPaidAmount;

      if (payableBalanceDelta > 0) {
        await clientRepository.decPayableBalance(
          order.client_id,
          payableBalanceDelta,
          tx,
        );
      } else if (payableBalanceDelta < 0) {
        await clientRepository.incPayableBalance(
          order.client_id,
          Math.abs(payableBalanceDelta),
          tx,
        );
      }

      return {
        message: "Payments updated successfully",
      };
    });
  },
};
