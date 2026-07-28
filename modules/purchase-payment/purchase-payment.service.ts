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
import { eq } from "drizzle-orm";
import { purchase_payments } from "@/drizzle/schema";

export const purchasePaymentService = {
  async createPurchasePayment(data: InsertPurchasePayment) {
    // ponytail: prevent creating payment with existing transaction_number
    const existing = await purchasePaymentRepository.getTransactionSummary(
      data.transaction_number,
    );
    if (existing) {
      throw new AppError("Nomor transaksi sudah digunakan", 400);
    }

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
      const existingPayments =
        await purchasePaymentRepository.getByTransactionNumber(
          data.transaction_number,
          tx,
        );

      if (existingPayments.length === 0) {
        throw new AppError("Transaksi tidak ditemukan", 404);
      }

      const clientId = existingPayments[0].client_id;
      const oldTotalPaid = existingPayments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );

      // 1. Revert old payments on purchase_orders
      await purchaseOrderRepository.bulkDecPaidAmountAndIncBalanceDue(
        existingPayments,
        tx,
      );

      // 2. Delete existing payment records for this transaction_number
      await purchasePaymentRepository.deleteByTransactionNumber(
        data.transaction_number,
        tx,
      );

      // 3. Resolve new purchase_order_ids in a single batch query (No N+1)
      const newTotalPaid = data.payments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );

      const uniqueInvoiceNumbers = Array.from(
        new Set(data.payments.map((p) => p.invoice_number)),
      );
      const orders = await purchaseOrderRepository.getByInvoiceNumbers(
        uniqueInvoiceNumbers,
        tx,
      );
      const orderMap = new Map(orders.map((o) => [o.invoice_number, o]));

      const defaultDate = existingPayments[0]?.payment_date
        ? dayjs(existingPayments[0].payment_date).toDate()
        : new Date();

      const newPaymentItems = data.payments.map((item) => {
        const order = orderMap.get(item.invoice_number);
        if (!order) {
          throw new AppError(
            `Nota ${item.invoice_number} tidak ditemukan`,
            404,
          );
        }
        return {
          client_id: clientId,
          purchase_order_id: order.id,
          paid_amount: item.paid_amount,
          transaction_number: data.transaction_number,
          payment_date: item.payment_date
            ? dayjs(item.payment_date).toDate()
            : defaultDate,
        };
      });

      if (newPaymentItems.length > 0) {
        await purchasePaymentRepository.insertTransactionPayments(
          newPaymentItems,
          tx,
        );
        await purchaseOrderRepository.bulkIncPaidAmountAndDecBalanceDue(
          newPaymentItems.map((p) => ({
            purchase_order_id: p.purchase_order_id,
            paid_amount: p.paid_amount,
          })),
          tx,
        );
      }

      // 4. Adjust client payable balance by delta
      const payableBalanceDelta = newTotalPaid - oldTotalPaid;
      if (payableBalanceDelta > 0) {
        await clientRepository.decPayableBalance(
          clientId,
          payableBalanceDelta,
          tx,
        );
      } else if (payableBalanceDelta < 0) {
        await clientRepository.incPayableBalance(
          clientId,
          Math.abs(payableBalanceDelta),
          tx,
        );
      }

      return {
        message: "Payments updated successfully",
      };
    });
  },

  getTransactionsByClientId(clientId: number) {
    return purchasePaymentRepository.getTransactionsByClientId(clientId);
  },

  getTransactionSummary(transactionNumber: string) {
    return purchasePaymentRepository.getTransactionSummary(transactionNumber);
  },

  deletePaymentTransaction(transactionNumber: string) {
    return db.transaction(async (tx) => {
      const payments = await tx
        .select({
          purchase_order_id: purchase_payments.purchase_order_id,
          paid_amount: purchase_payments.paid_amount,
          client_id: purchase_payments.client_id,
        })
        .from(purchase_payments)
        .where(eq(purchase_payments.transaction_number, transactionNumber));

      if (payments.length === 0) {
        throw new AppError("Transaction not found", 404);
      }

      const totalPaidAmount = payments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );
      const clientId = payments[0].client_id;

      // Update invoices
      await purchaseOrderRepository.bulkDecPaidAmountAndIncBalanceDue(
        payments,
        tx,
      );

      // Update client balance
      await clientRepository.incPayableBalance(clientId, totalPaidAmount, tx);

      // Delete payments
      await purchasePaymentRepository.deleteByTransactionNumber(
        transactionNumber,
        tx,
      );

      return { message: "Payment transaction deleted successfully" };
    });
  },
};
