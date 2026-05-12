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

  async getEditPurchaseReturnDetail(returnId: number) {
    const data =
      await purchaseReturnRepository.getEditPurchaseReturnDetailById(returnId);

    if (!data) {
      throw new AppError("Data retur tidak ditemukan", 404);
    }

    return data;
  },

  updatePurchaseReturn(data: UpdatePurchaseReturn) {
    return db.transaction(async (tx) => {
      const [existingReturn] = await purchaseReturnRepository.getById(
        data.purchase_return_id,
        tx,
      );
      if (!existingReturn) {
        throw new AppError("Data retur pembelian tidak ditemukan", 404);
      }

      const order = await purchaseOrderRepository.getById(
        existingReturn.purchase_order_id,
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

      const existingReturnLines =
        await purchaseReturnLineRepository.getByPurchaseReturnIds(
          [data.purchase_return_id],
          tx,
        );

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
        [data.purchase_return_id],
        tx,
      );
      await purchaseReturnRepository.deleteById(data.purchase_return_id, tx);

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
        // Recalculate invoice value
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
          message:
            "Dokumen retur pembelian berhasil dibatalkan karena semua jumlah retur di-nol-kan",
        };
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

  getReturnHistory(purchaseOrderId: number) {
    return purchaseReturnRepository.getReturnHistoryByPurchaseOrderId(
      purchaseOrderId,
    );
  },

  deletePurchaseReturn(returnId: number) {
    return db.transaction(async (tx) => {
      const [existingReturn] = await purchaseReturnRepository.getById(
        returnId,
        tx,
      );
      if (!existingReturn) {
        throw new AppError("Data retur pembelian tidak ditemukan", 404);
      }

      const order = await purchaseOrderRepository.getById(
        existingReturn.purchase_order_id,
        tx,
      );
      if (!order) {
        throw new AppError("Invoice not found", 404);
      }

      if (order.paid_amount > 0) {
        throw new AppError(
          "Retur tidak bisa dihapus karena nota sudah ada pembayaran",
          400,
        );
      }

      const existingReturnLines =
        await purchaseReturnLineRepository.getByPurchaseReturnIds(
          [returnId],
          tx,
        );

      // Revert order line quantities
      const revertOrderLineUpdates = existingReturnLines.map((line) => ({
        id: line.purchase_order_line_id,
        quantity: line.return_qty,
      }));
      await purchaseOrderLineRepository.bulkIncrementQuantity(
        revertOrderLineUpdates,
        tx,
      );

      // Revert stock quantities (increase stock back)
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

      // Delete return lines and document
      await purchaseReturnLineRepository.deleteByPurchaseReturnIds(
        [returnId],
        tx,
      );
      await purchaseReturnRepository.deleteById(returnId, tx);

      // Recalculate invoice total
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

      // Update client balance (increase payable/debt)
      const payableDelta = newInvoiceTotal - order.invoice_value;
      await clientRepository.incPayableBalance(
        order.client_id,
        payableDelta,
        tx,
      );

      return {
        message: "Retur pembelian berhasil dihapus",
      };
    });
  },
};
