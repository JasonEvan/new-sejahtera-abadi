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
import { sql } from "drizzle-orm";
import { Tx } from "@/lib/common-types";

function lockPurchasePayments(tx: Tx) {
  return tx.execute(
    sql`SELECT pg_advisory_xact_lock(${0x534150}::int, ${2}::int)`,
  );
}

function addPayment(
  payments: Map<number, number>,
  orderId: number,
  amount: number,
) {
  payments.set(orderId, (payments.get(orderId) ?? 0) + amount);
}

function assertPaymentClient(orderClientId: number, clientId: number) {
  if (orderClientId !== clientId) {
    throw new AppError("Nota tidak sesuai dengan klien transaksi", 400);
  }
}

function assertPaymentBalance(
  invoiceNumber: string,
  paid: number,
  max: number,
) {
  if (paid > max) {
    throw new AppError(
      `Pelunasan nota ${invoiceNumber} tidak boleh melebihi saldo nota (${max.toLocaleString("id-ID")})`,
      400,
    );
  }
}

function transactionPaymentTotals(
  payments: {
    client_id: number;
    purchase_order_id: number;
    paid_amount: number;
  }[],
  clientId: number,
) {
  const paidByOrder = new Map<number, number>();
  let total = 0;
  for (const payment of payments) {
    assertPaymentClient(payment.client_id, clientId);
    addPayment(paidByOrder, payment.purchase_order_id, payment.paid_amount);
    total += payment.paid_amount;
  }
  return { paidByOrder, total };
}

function assertTransactionOrders(
  orders: { id: number; client_id: number }[],
  paidByOrder: Map<number, number>,
  clientId: number,
) {
  let found = 0;
  for (const order of orders) {
    if (paidByOrder.has(order.id)) {
      assertPaymentClient(order.client_id, clientId);
      found++;
    }
  }
  if (found !== paidByOrder.size) {
    throw new AppError("Nota tidak ditemukan", 404);
  }
}

export const purchasePaymentService = {
  async createPurchasePayment(data: InsertPurchasePayment) {
    return db.transaction(async (tx) => {
      await lockPurchasePayments(tx);
      const existing = await purchasePaymentRepository.getByTransactionNumber(
        data.transaction_number,
        tx,
      );
      if (existing.length > 0) {
        throw new AppError("Nomor transaksi sudah digunakan", 400);
      }

      const paidByOrder = new Map<number, number>();
      let totalPayments = 0;
      for (const item of data.cart) {
        addPayment(paidByOrder, item.purchase_order_id, item.paid_amount);
        totalPayments += item.paid_amount;
      }

      const orders = await purchaseOrderRepository.getOrdersForUpdate(
        { ids: [...paidByOrder.keys()] },
        tx,
      );
      assertTransactionOrders(orders, paidByOrder, data.client_id);
      for (const order of orders) {
        assertPaymentBalance(
          order.invoice_number,
          paidByOrder.get(order.id)!,
          order.balance_due,
        );
      }

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
      await lockPurchasePayments(tx);
      const [order] = await purchaseOrderRepository.getOrdersForUpdate(
        { invoiceNumbers: [data.invoice_number] },
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
      await lockPurchasePayments(tx);
      const existingPayments =
        await purchasePaymentRepository.getByTransactionNumber(
          data.transaction_number,
          tx,
        );

      if (existingPayments.length === 0) {
        throw new AppError("Transaksi tidak ditemukan", 404);
      }

      const clientId = existingPayments[0].client_id;
      const { paidByOrder: oldPaidByOrder, total: oldTotalPaid } =
        transactionPaymentTotals(existingPayments, clientId);
      const orders = await purchaseOrderRepository.getOrdersForUpdate(
        {
          ids: [...oldPaidByOrder.keys()],
          invoiceNumbers: [
            ...new Set(data.payments.map((p) => p.invoice_number)),
          ],
        },
        tx,
      );
      assertTransactionOrders(orders, oldPaidByOrder, clientId);
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
        assertPaymentClient(order.client_id, clientId);
        addPayment(newPaidByOrder, order.id, item.paid_amount);
        newTotalPaid += item.paid_amount;
      }

      for (const order of orders) {
        const newPaid = newPaidByOrder.get(order.id);
        if (newPaid === undefined) continue;
        assertPaymentBalance(
          order.invoice_number,
          newPaid,
          order.balance_due + (oldPaidByOrder.get(order.id) ?? 0),
        );
      }

      await purchaseOrderRepository.bulkDecPaidAmountAndIncBalanceDue(
        existingPayments,
        tx,
      );
      await purchasePaymentRepository.deleteByTransactionNumber(
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

  deletePaymentTransaction(transactionId: number) {
    return db.transaction(async (tx) => {
      await lockPurchasePayments(tx);
      const payment = await purchasePaymentRepository.getById(
        transactionId,
        tx,
      );
      if (!payment) {
        throw new AppError("Payment transaction not found", 404);
      }
      const transactionNumber = payment.transaction_number;
      const payments = await purchasePaymentRepository.getByTransactionNumber(
        transactionNumber,
        tx,
      );

      if (payments.length === 0) {
        throw new AppError("Transaction not found", 404);
      }

      const clientId = payments[0].client_id;
      const { paidByOrder, total: totalPaidAmount } = transactionPaymentTotals(
        payments,
        clientId,
      );
      const orders = await purchaseOrderRepository.getOrdersForUpdate(
        { ids: [...paidByOrder.keys()] },
        tx,
      );
      assertTransactionOrders(orders, paidByOrder, clientId);

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
