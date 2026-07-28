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
import { eq } from "drizzle-orm";
import { sales_payments } from "@/drizzle/schema";

export const salesPaymentService = {
  async createSalesPayment(data: InsertSalesPayment) {
    // ponytail: prevent creating payment with existing transaction_number
    const existing = await salesPaymentRepository.getTransactionSummary(
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
      const existingPayments =
        await salesPaymentRepository.getByTransactionNumber(
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

      // 1. Revert old payments on sales_orders
      await saleOrderRepository.bulkDecPaidAmountAndIncBalanceDue(
        existingPayments,
        tx,
      );

      // 2. Delete existing payment records for this transaction_number
      await salesPaymentRepository.deleteByTransactionNumber(
        data.transaction_number,
        tx,
      );

      // 3. Resolve new sales_order_ids in a single batch query (No N+1)
      const newTotalPaid = data.payments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );

      const uniqueInvoiceNumbers = Array.from(
        new Set(data.payments.map((p) => p.invoice_number)),
      );
      const orders = await saleOrderRepository.getByInvoiceNumbers(
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
          throw new AppError(`Nota ${item.invoice_number} tidak ditemukan`, 404);
        }
        return {
          client_id: clientId,
          sales_order_id: order.id,
          paid_amount: item.paid_amount,
          transaction_number: data.transaction_number,
          payment_date: item.payment_date
            ? dayjs(item.payment_date).toDate()
            : defaultDate,
        };
      });

      if (newPaymentItems.length > 0) {
        await salesPaymentRepository.insertTransactionPayments(
          newPaymentItems,
          tx,
        );
        await saleOrderRepository.bulkIncPaidAmountAndDecBalanceDue(
          newPaymentItems.map((p) => ({
            sales_order_id: p.sales_order_id,
            paid_amount: p.paid_amount,
          })),
          tx,
        );
      }

      // 4. Adjust client receivable balance by delta
      const receivableBalanceDelta = newTotalPaid - oldTotalPaid;
      if (receivableBalanceDelta > 0) {
        await clientRepository.decReceivableBalance(
          clientId,
          receivableBalanceDelta,
          tx,
        );
      } else if (receivableBalanceDelta < 0) {
        await clientRepository.incReceivableBalance(
          clientId,
          Math.abs(receivableBalanceDelta),
          tx,
        );
      }

      return {
        message: "Payments updated successfully",
      };
    });
  },

  getTransactionsByClientId(clientId: number) {
    return salesPaymentRepository.getTransactionsByClientId(clientId);
  },

  getTransactionSummary(transactionNumber: string) {
    return salesPaymentRepository.getTransactionSummary(transactionNumber);
  },

  deletePaymentTransaction(transactionNumber: string) {
    return db.transaction(async (tx) => {
      const payments = await tx
        .select({
          sales_order_id: sales_payments.sales_order_id,
          paid_amount: sales_payments.paid_amount,
          client_id: sales_payments.client_id,
        })
        .from(sales_payments)
        .where(eq(sales_payments.transaction_number, transactionNumber));

      if (payments.length === 0) {
        throw new AppError("Transaction not found", 404);
      }

      const totalPaidAmount = payments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );
      const clientId = payments[0].client_id;

      // Update invoices
      await saleOrderRepository.bulkDecPaidAmountAndIncBalanceDue(payments, tx);

      // Update client balance
      await clientRepository.incReceivableBalance(
        clientId,
        totalPaidAmount,
        tx,
      );

      // Delete payments
      await salesPaymentRepository.deleteByTransactionNumber(
        transactionNumber,
        tx,
      );

      return { message: "Payment transaction deleted successfully" };
    });
  },
};
