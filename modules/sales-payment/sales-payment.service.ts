import db from "@/lib/drizzle";
import type { Tx } from "@/lib/common-types";
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
import { sql } from "drizzle-orm";

function lockPaymentMutations(tx: Tx) {
  return tx.execute(
    sql`SELECT pg_advisory_xact_lock(${0x534150}::int, ${1}::int)`,
  );
}

function addPayment(
  totals: Map<number, number>,
  orderId: number,
  paid: number,
) {
  totals.set(orderId, (totals.get(orderId) ?? 0) + paid);
}

function validateOrderPayment(
  order: { client_id: number; invoice_number: string },
  clientId: number,
  paid: number | undefined,
  maxAllowed: number,
) {
  if (order.client_id !== clientId) {
    throw new AppError(
      `Nota ${order.invoice_number} bukan milik klien ini`,
      400,
    );
  }
  if (paid !== undefined && paid > maxAllowed) {
    throw new AppError(
      `Pelunasan nota ${order.invoice_number} tidak boleh melebihi saldo nota (${maxAllowed.toLocaleString("id-ID")})`,
      400,
    );
  }
}

export const salesPaymentService = {
  async createSalesPayment(data: InsertSalesPayment) {
    return db.transaction(async (tx) => {
      await lockPaymentMutations(tx);
      const existing = await salesPaymentRepository.getByTransactionNumber(
        data.transaction_number,
        tx,
      );
      if (existing.length > 0) {
        throw new AppError("Nomor transaksi sudah digunakan", 400);
      }

      const paidByOrder = new Map<number, number>();
      let totalPayments = 0;
      for (const item of data.cart) {
        addPayment(paidByOrder, item.sales_order_id, item.paid_amount);
        totalPayments += item.paid_amount;
      }
      const orders = await saleOrderRepository.getOrdersForUpdate(
        { ids: Array.from(paidByOrder.keys()) },
        tx,
      );
      if (orders.length !== paidByOrder.size) {
        throw new AppError("Nota tidak ditemukan", 404);
      }
      for (const order of orders) {
        validateOrderPayment(
          order,
          data.client_id,
          paidByOrder.get(order.id)!,
          order.balance_due,
        );
      }

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
      await lockPaymentMutations(tx);
      const [order] = await saleOrderRepository.getOrdersForUpdate(
        { invoiceNumbers: [data.invoice_number] },
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
      await lockPaymentMutations(tx);
      const existingPayments =
        await salesPaymentRepository.getByTransactionNumber(
          data.transaction_number,
          tx,
        );

      if (existingPayments.length === 0) {
        throw new AppError("Transaksi tidak ditemukan", 404);
      }

      const clientId = existingPayments[0].client_id;
      const oldPaidByOrder = new Map<number, number>();
      let oldTotalPaid = 0;
      for (const payment of existingPayments) {
        if (payment.client_id !== clientId) {
          throw new AppError("Pembayaran bukan milik klien yang sama", 400);
        }
        addPayment(oldPaidByOrder, payment.sales_order_id, payment.paid_amount);
        oldTotalPaid += payment.paid_amount;
      }

      const orders = await saleOrderRepository.getOrdersForUpdate(
        {
          ids: Array.from(oldPaidByOrder.keys()),
          invoiceNumbers: Array.from(
            new Set(data.payments.map((item) => item.invoice_number)),
          ),
        },
        tx,
      );
      const orderMap = new Map(orders.map((o) => [o.invoice_number, o]));

      const newPaidByOrder = new Map<number, number>();
      let newTotalPaid = 0;
      for (const item of data.payments) {
        const order = orderMap.get(item.invoice_number);
        if (!order) {
          throw new AppError(
            `Nota ${item.invoice_number} tidak ditemukan`,
            404,
          );
        }
        addPayment(newPaidByOrder, order.id, item.paid_amount);
        newTotalPaid += item.paid_amount;
      }

      // Validate against the locked balance before reversing any old payments.
      let oldOrderCount = 0;
      for (const order of orders) {
        const oldPaid = oldPaidByOrder.get(order.id);
        const newPaid = newPaidByOrder.get(order.id);
        if (oldPaid !== undefined) oldOrderCount++;
        validateOrderPayment(
          order,
          clientId,
          newPaid,
          order.balance_due + (oldPaid ?? 0),
        );
      }
      if (oldOrderCount !== oldPaidByOrder.size) {
        throw new AppError("Nota tidak ditemukan", 404);
      }

      await saleOrderRepository.bulkDecPaidAmountAndIncBalanceDue(
        existingPayments,
        tx,
      );
      await salesPaymentRepository.deleteByTransactionNumber(
        data.transaction_number,
        tx,
      );

      const defaultDate = existingPayments[0]?.payment_date
        ? dayjs(existingPayments[0].payment_date).toDate()
        : new Date();

      const newPaymentItems = data.payments.map((item) => {
        const order = orderMap.get(item.invoice_number)!;
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
          newPaymentItems,
          tx,
        );
      }

      // Adjust client receivable balance by delta.
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

  deletePaymentTransaction(transactionId: number) {
    return db.transaction(async (tx) => {
      await lockPaymentMutations(tx);
      const payment = await salesPaymentRepository.getById(transactionId, tx);
      if (!payment) {
        throw new AppError("Payment transaction not found", 404);
      }
      const transactionNumber = payment.transaction_number;
      const payments = await salesPaymentRepository.getByTransactionNumber(
        transactionNumber,
        tx,
      );

      if (payments.length === 0) {
        throw new AppError("Transaction not found", 404);
      }

      const totalPaidAmount = payments.reduce(
        (sum, p) => sum + p.paid_amount,
        0,
      );
      const clientId = payments[0].client_id;

      await saleOrderRepository.getOrdersForUpdate(
        { ids: Array.from(new Set(payments.map((p) => p.sales_order_id))) },
        tx,
      );
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
