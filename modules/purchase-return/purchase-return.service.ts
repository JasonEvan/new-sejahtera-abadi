import db from "@/lib/drizzle";
import { purchaseReturnRepository } from "./purchase-return.repository";
import {
  InsertPurchaseReturn,
  UpdatePurchaseReturn,
} from "./purchase-return.types";
import { AppError } from "@/lib/errors";
import { purchaseReturnLineRepository } from "./purchase-return-line.repository";
import { purchaseOrderLineRepository } from "../purchase/purchase-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { purchaseOrderRepository } from "../purchase/purchase-order.repository";
import { clientRepository } from "../client/client.repository";

export const purchaseReturnService = {
  createPurchaseReturn(data: InsertPurchaseReturn) {
    return db.transaction(async (tx) => {
      const hasReturn = await purchaseReturnRepository.hasReturnForPurchaseOrder(
        data.purchase_order_id,
        tx,
      );
      if (hasReturn) {
        throw new AppError(
          "Retur pembelian untuk nota ini sudah ada, gunakan menu edit retur",
          400,
        );
      }

      const [insertedReturn] =
        await purchaseReturnRepository.createPurchaseReturn(data, tx);
      if (!insertedReturn) {
        throw new AppError("Failed to create purchase return", 500);
      }

      const purchaseOrderLineIds = data.lines.map(
        (l) => l.purchase_order_line_id,
      );
      const lineDetails = await purchaseOrderLineRepository.getLineDetails(
        purchaseOrderLineIds,
        tx,
      );

      const enrichedLines = data.lines.map((line) => {
        const detail = lineDetails.find(
          (d) => d.id === line.purchase_order_line_id,
        );
        if (!detail)
          throw new AppError(
            `Order line ${line.purchase_order_line_id} not found`,
            404,
          );
        return {
          purchase_order_line_id: line.purchase_order_line_id,
          return_qty: line.return_qty,
          price: detail.price,
          stock_id: detail.stock_id ?? 0,
        };
      });

      await purchaseReturnLineRepository.createPurchaseReturnLine(
        enrichedLines,
        insertedReturn.id,
        tx,
      );

      const decrementPurchaseOrderLine = enrichedLines.map((l) => ({
        id: l.purchase_order_line_id,
        quantity: l.return_qty,
      }));
      await purchaseOrderLineRepository.bulkDecrementQuantity(
        decrementPurchaseOrderLine,
        tx,
      );

      const decrementStock = enrichedLines.map((l) => ({
        id: l.stock_id,
        quantity: l.return_qty,
      }));
      await stockRepository.bulkDecrementStockAndIncrementQtyOut(
        decrementStock,
        tx,
      );

      const discount = await purchaseOrderRepository.getDiscountById(
        data.purchase_order_id,
        tx,
      );

      const rawTotal =
        await purchaseOrderLineRepository.getSumTotalPriceByOrderId(
          data.purchase_order_id,
          tx,
        );

      const oldInvoiceValue = await purchaseOrderRepository.getInvoiceValueById(
        data.purchase_order_id,
        tx,
      );

      const newTotal = Math.floor(rawTotal * (1 - discount / 100));
      await purchaseOrderRepository.updateInvoiceValue(
        newTotal,
        data.purchase_order_id,
        tx,
      );

      const reduction = newTotal - oldInvoiceValue;
      await clientRepository.incPayableBalance(data.client_id, reduction, tx);
    });
  },

  getUnpaidReturnedInvoices() {
    return purchaseReturnRepository.getUnpaidReturnedInvoices();
  },

  async getEditPurchaseReturnDetail(invoiceNumber: string) {
    const data =
      await purchaseReturnRepository.getEditPurchaseReturnDetailByInvoice(
        invoiceNumber,
      );

    if (!data) {
      throw new AppError("Invoice retur tidak ditemukan", 404);
    }

    return data;
  },

  updatePurchaseReturn(data: UpdatePurchaseReturn) {
    return db.transaction(async (tx) => {
      const normalizedInvoice = data.invoice_number.trim().toUpperCase();

      const order = await purchaseOrderRepository.getByInvoiceNumber(
        normalizedInvoice,
        tx,
      );
      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      if (order.paid_amount > 0) {
        throw new AppError(
          "Retur tidak bisa diedit karena nota sudah dibayar",
          400,
        );
      }

      const existingReturns =
        await purchaseReturnRepository.getByPurchaseOrderId(order.id, tx);
      if (existingReturns.length === 0) {
        throw new AppError("Data retur pembelian tidak ditemukan", 404);
      }

      const existingReturnIds = existingReturns.map((row) => row.id);

      const existingReturnLines =
        await purchaseReturnLineRepository.getByPurchaseReturnIds(
          existingReturnIds,
          tx,
        );

      // Revert process: restore order line qty and stock movements from previous return rows.
      const revertOrderLineUpdates = existingReturnLines.map((line) => ({
        id: line.purchase_order_line_id,
        quantity: line.return_qty,
      }));
      await purchaseOrderLineRepository.bulkIncrementQuantity(
        revertOrderLineUpdates,
        tx,
      );

      const revertStocks = existingReturnLines
        .filter((line) => (line.stock_id ?? 0) > 0)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.return_qty,
        }));
      await stockRepository.bulkIncrementStockAndDecrementQtyOut(
        revertStocks,
        tx,
      );

      await purchaseReturnLineRepository.deleteByPurchaseReturnIds(
        existingReturnIds,
        tx,
      );
      await purchaseReturnRepository.deleteByPurchaseOrderId(order.id, tx);

      const latestOrderLines =
        await purchaseOrderLineRepository.getByPurchaseOrderId(order.id, tx);

      const lineQtyById = new Map(
        latestOrderLines.map((line) => [line.id, line.qty]),
      );
      const availableLineIds = new Set(latestOrderLines.map((line) => line.id));
      for (const line of data.lines) {
        if (!availableLineIds.has(line.purchase_order_line_id)) {
          throw new AppError(
            `Order line ${line.purchase_order_line_id} does not belong to selected invoice`,
            400,
          );
        }

        const currentQty = lineQtyById.get(line.purchase_order_line_id) ?? 0;
        if (line.return_qty > currentQty) {
          throw new AppError(
            `Jumlah retur melebihi jumlah barang pada line ${line.purchase_order_line_id}`,
            400,
          );
        }
      }

      const returnableLines = data.lines.filter((line) => line.return_qty > 0);
      if (returnableLines.length === 0) {
        throw new AppError("Pilih minimal 1 item untuk diretur", 400);
      }

      const lineIds = returnableLines.map(
        (line) => line.purchase_order_line_id,
      );
      const lineDetails = await purchaseOrderLineRepository.getLineDetails(
        lineIds,
        tx,
      );

      const enrichedLines = returnableLines.map((line) => {
        const detail = lineDetails.find(
          (item) => item.id === line.purchase_order_line_id,
        );
        if (!detail) {
          throw new AppError(
            `Order line ${line.purchase_order_line_id} not found`,
            404,
          );
        }

        return {
          purchase_order_line_id: line.purchase_order_line_id,
          return_qty: line.return_qty,
          price: detail.price,
          stock_id: detail.stock_id ?? 0,
        };
      });

      const [insertedReturn] =
        await purchaseReturnRepository.createPurchaseReturn(
          {
            client_id: order.client_id,
            purchase_order_id: order.id,
            return_date: data.return_date,
            lines: returnableLines,
          },
          tx,
        );
      if (!insertedReturn) {
        throw new AppError("Failed to update purchase return", 500);
      }

      await purchaseReturnLineRepository.createPurchaseReturnLine(
        enrichedLines,
        insertedReturn.id,
        tx,
      );

      const decrementOrderLines = enrichedLines.map((line) => ({
        id: line.purchase_order_line_id,
        quantity: line.return_qty,
      }));
      await purchaseOrderLineRepository.bulkDecrementQuantity(
        decrementOrderLines,
        tx,
      );

      const decrementStocks = enrichedLines
        .filter((line) => line.stock_id > 0)
        .map((line) => ({
          id: line.stock_id,
          quantity: line.return_qty,
        }));
      await stockRepository.bulkDecrementStockAndIncrementQtyOut(
        decrementStocks,
        tx,
      );

      const discount = await purchaseOrderRepository.getDiscountById(
        order.id,
        tx,
      );
      const rawTotal =
        await purchaseOrderLineRepository.getSumTotalPriceByOrderId(
          order.id,
          tx,
        );
      const newInvoiceTotal = Math.floor(rawTotal * (1 - discount / 100));

      await purchaseOrderRepository.updateInvoiceValue(
        newInvoiceTotal,
        order.id,
        tx,
      );

      const payableDelta = newInvoiceTotal - order.invoice_value;
      await clientRepository.incPayableBalance(
        order.client_id,
        payableDelta,
        tx,
      );

      return {
        message: "Purchase return updated successfully",
      };
    });
  },
};
