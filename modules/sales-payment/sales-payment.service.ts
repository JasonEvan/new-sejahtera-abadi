import db from "@/lib/drizzle";
import {
  DeleteEditReceivablesByInvoiceInput,
  InsertSalesPayment,
  UpdateEditReceivablesByInvoiceInput,
} from "./sales-payment.types";
import { salesPaymentRepository } from "./sales-payment.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { clientRepository } from "../client/client.repository";
import dayjs from "dayjs";
import { AppError } from "@/lib/errors";

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

  async getEditReceivablesByInvoice(invoiceNumber: string) {
    const result =
      await salesPaymentRepository.getEditReceivablesByInvoice(invoiceNumber);

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

  deleteEditReceivablesByInvoice(data: DeleteEditReceivablesByInvoiceInput) {
    return db.transaction(async (tx) => {
      const order = await saleOrderRepository.getByInvoiceNumber(
        data.invoice_number,
        tx,
      );

      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      const existingPayments = await salesPaymentRepository.getBySalesOrderId(
        order.id,
        tx,
      );

      const oldTotalPaidAmount = existingPayments.reduce(
        (total, item) => total + item.paid_amount,
        0,
      );

      await salesPaymentRepository.deleteBySalesOrderId(order.id, tx);

      if (oldTotalPaidAmount > 0) {
        await saleOrderRepository.updatePaidAndBalanceDue(
          order.id,
          {
            paid_amount: Math.max(order.paid_amount - oldTotalPaidAmount, 0),
            balance_due: order.balance_due + oldTotalPaidAmount,
          },
          tx,
        );

        await clientRepository.incReceivableBalance(
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

  updateEditReceivablesByInvoice(data: UpdateEditReceivablesByInvoiceInput) {
    return db.transaction(async (tx) => {
      const order = await saleOrderRepository.getByInvoiceNumber(
        data.invoice_number,
        tx,
      );

      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      const existingPayments = await salesPaymentRepository.getBySalesOrderId(
        order.id,
        tx,
      );

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

      await salesPaymentRepository.deleteBySalesOrderId(order.id, tx);

      await salesPaymentRepository.insertEditReceivablesPaymentRows(
        {
          client_id: order.client_id,
          sales_order_id: order.id,
          payments: data.payments,
        },
        tx,
      );

      await saleOrderRepository.updatePaidAndBalanceDue(
        order.id,
        {
          paid_amount: newTotalPaidAmount,
          balance_due: order.invoice_value - newTotalPaidAmount,
        },
        tx,
      );

      const receivableBalanceDelta = newTotalPaidAmount - oldTotalPaidAmount;

      if (receivableBalanceDelta > 0) {
        await clientRepository.decReceivableBalance(
          order.client_id,
          receivableBalanceDelta,
          tx,
        );
      } else if (receivableBalanceDelta < 0) {
        await clientRepository.incReceivableBalance(
          order.client_id,
          Math.abs(receivableBalanceDelta),
          tx,
        );
      }

      return {
        message: "Payments updated successfully",
      };
    });
  },
};
