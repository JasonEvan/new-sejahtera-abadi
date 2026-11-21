import db from "@/lib/drizzle";
import { Tx } from "@/lib/common-types";
import { salesReturnRepository } from "./sales-return.repository";
import { InsertSaleReturn, UpdateSaleReturn } from "./sales-return.types";
import { AppError } from "@/lib/errors";
import { salesReturnLineRepository } from "./sales-return-line.repository";
import { saleOrderLineRepository } from "../sale/sale-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { clientRepository } from "../client/client.repository";

async function getValidatedReturnLines(
  orderId: number,
  lines: InsertSaleReturn["lines"],
  tx: Tx,
) {
  const quantities = new Map<number, number>();
  for (const { sales_order_line_id: id, return_qty: qty } of lines) {
    if (qty > 0) {
      quantities.set(id, (quantities.get(id) ?? 0) + qty);
    }
  }

  if (quantities.size === 0) return [];

  const details = await saleOrderLineRepository.getLineDetails(
    orderId,
    Array.from(quantities.keys()),
    tx,
  );
  const detailsById = new Map(details.map((line) => [line.id, line]));

  return Array.from(quantities, ([id, qty]) => {
    const detail = detailsById.get(id);
    if (!detail) {
      throw new AppError(
        `Order line ${id} does not belong to selected invoice`,
        400,
      );
    }
    if (qty > detail.qty) {
      throw new AppError(
        `Jumlah retur melebihi jumlah barang pada line ${id}`,
        400,
      );
    }
    return {
      sales_order_line_id: id,
      return_qty: qty,
      price: detail.price,
      stock_id: detail.stock_id ?? 0,
    };
  });
}

async function getLockedReturnOrder(returnId: number, tx: Tx) {
  const [existingReturn] = await salesReturnRepository.getById(returnId, tx);
  if (!existingReturn) {
    throw new AppError("Data retur penjualan tidak ditemukan", 404);
  }

  const order = await saleOrderRepository.getById(
    existingReturn.sales_order_id,
    tx,
  );
  if (!order) {
    throw new AppError("Invoice not found", 404);
  }

  // Another transaction may have edited or deleted this return while we waited.
  const [currentReturn] = await salesReturnRepository.getById(returnId, tx);
  if (!currentReturn || currentReturn.sales_order_id !== order.id) {
    throw new AppError("Data retur penjualan tidak ditemukan", 404);
  }
  return order;
}

export const salesReturnService = {
  createSalesReturn(data: InsertSaleReturn) {
    return db.transaction(async (tx) => {
      const order = await saleOrderRepository.getById(data.sales_order_id, tx);
      if (!order) {
        throw new AppError("Invoice not found", 404);
      }
      if (order.client_id !== data.client_id) {
        throw new AppError("Nota tidak dimiliki oleh klien yang dipilih", 400);
      }
      if (order.paid_amount !== 0) {
        throw new AppError(
          "Retur tidak bisa dibuat karena nota sudah dibayar",
          400,
        );
      }

      const enrichedLines = await getValidatedReturnLines(
        order.id,
        data.lines,
        tx,
      );

      const [insertedReturn] = await salesReturnRepository.createSalesReturn(
        data,
        tx,
      );
      if (!insertedReturn) {
        throw new AppError("Failed to create sales return", 500);
      }

      await salesReturnLineRepository.createSalesReturnLine(
        enrichedLines,
        insertedReturn.id,
        tx,
      );

      const decrementSalesOrderLine = enrichedLines.map((l) => ({
        id: l.sales_order_line_id,
        quantity: l.return_qty,
      }));
      await saleOrderLineRepository.bulkDecrementQuantity(
        decrementSalesOrderLine,
        tx,
      );

      const incrementStock = enrichedLines
        .filter((line) => line.stock_id > 0)
        .map((line) => ({
          id: line.stock_id,
          quantity: line.return_qty,
        }));
      await stockRepository.bulkIncrementStockAndIncrementQtyIn(
        incrementStock,
        tx,
      );

      const discount = await saleOrderRepository.getDiscountById(
        data.sales_order_id,
        tx,
      );

      const rawTotal = await saleOrderLineRepository.getSumTotalPriceByOrderId(
        data.sales_order_id,
        tx,
      );

      const newTotal = Math.floor(rawTotal * (1 - discount / 100));
      await saleOrderRepository.updateInvoiceValue(
        newTotal,
        data.sales_order_id,
        tx,
      );

      const reduction = newTotal - order.invoice_value;
      await clientRepository.incReceivableBalance(
        order.client_id,
        reduction,
        tx,
      );
    });
  },

  getUnpaidReturnedInvoices() {
    return salesReturnRepository.getUnpaidReturnedInvoices();
  },

  async getEditSaleReturnDetail(returnId: number) {
    const data =
      await salesReturnRepository.getEditSaleReturnDetailById(returnId);

    if (!data) {
      throw new AppError("Data retur tidak ditemukan", 404);
    }

    return data;
  },

  updateSaleReturn(data: UpdateSaleReturn) {
    return db.transaction(async (tx) => {
      const order = await getLockedReturnOrder(data.sales_return_id, tx);

      if (order.paid_amount !== 0) {
        throw new AppError(
          "Retur tidak bisa diedit karena nota sudah dibayar",
          400,
        );
      }

      const existingReturnLines =
        await salesReturnLineRepository.getBySalesReturnIds(
          [data.sales_return_id],
          tx,
        );

      const revertOrderLineUpdates = existingReturnLines.map((line) => ({
        id: line.sales_order_line_id,
        quantity: line.return_qty,
      }));
      await saleOrderLineRepository.bulkIncrementQuantity(
        revertOrderLineUpdates,
        tx,
      );

      const enrichedLines = await getValidatedReturnLines(
        order.id,
        data.lines,
        tx,
      );

      const revertStocks = existingReturnLines
        .filter((line) => (line.stock_id ?? 0) > 0)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.return_qty,
        }));
      await stockRepository.bulkDecrementStockAndDecrementQtyIn(
        revertStocks,
        tx,
      );

      await salesReturnLineRepository.deleteBySalesReturnIds(
        [data.sales_return_id],
        tx,
      );
      await salesReturnRepository.deleteById(data.sales_return_id, tx);

      if (enrichedLines.length > 0) {
        const [insertedReturn] = await salesReturnRepository.createSalesReturn(
          {
            client_id: order.client_id,
            sales_order_id: order.id,
            return_date: data.return_date,
            lines: enrichedLines,
          },
          tx,
        );
        if (!insertedReturn) {
          throw new AppError("Failed to update sales return", 500);
        }

        await salesReturnLineRepository.createSalesReturnLine(
          enrichedLines,
          insertedReturn.id,
          tx,
        );

        const decrementOrderLines = enrichedLines.map((line) => ({
          id: line.sales_order_line_id,
          quantity: line.return_qty,
        }));
        await saleOrderLineRepository.bulkDecrementQuantity(
          decrementOrderLines,
          tx,
        );

        const incrementStocks = enrichedLines
          .filter((line) => line.stock_id > 0)
          .map((line) => ({
            id: line.stock_id,
            quantity: line.return_qty,
          }));
        await stockRepository.bulkIncrementStockAndIncrementQtyIn(
          incrementStocks,
          tx,
        );
      }

      const discount = await saleOrderRepository.getDiscountById(order.id, tx);
      const rawTotal = await saleOrderLineRepository.getSumTotalPriceByOrderId(
        order.id,
        tx,
      );
      const newInvoiceTotal = Math.floor(rawTotal * (1 - discount / 100));

      await saleOrderRepository.updateInvoiceValue(
        newInvoiceTotal,
        order.id,
        tx,
      );

      const receivableDelta = newInvoiceTotal - order.invoice_value;
      await clientRepository.incReceivableBalance(
        order.client_id,
        receivableDelta,
        tx,
      );

      return {
        message:
          enrichedLines.length === 0
            ? "Dokumen retur berhasil dibatalkan karena semua jumlah retur di-nol-kan"
            : "Sales return updated successfully",
      };
    });
  },

  getReturnHistory(salesOrderId: number) {
    return salesReturnRepository.getReturnHistoryBySalesOrderId(salesOrderId);
  },

  deleteSalesReturn(returnId: number) {
    return db.transaction(async (tx) => {
      const order = await getLockedReturnOrder(returnId, tx);

      if (order.paid_amount !== 0) {
        throw new AppError(
          "Retur tidak bisa dihapus karena nota sudah ada pembayaran",
          400,
        );
      }

      const existingReturnLines =
        await salesReturnLineRepository.getBySalesReturnIds([returnId], tx);

      // Revert order line quantities (add back the returned qty)
      const revertOrderLineUpdates = existingReturnLines.map((line) => ({
        id: line.sales_order_line_id,
        quantity: line.return_qty,
      }));
      await saleOrderLineRepository.bulkIncrementQuantity(
        revertOrderLineUpdates,
        tx,
      );

      // Revert stock quantities (decrease stock since it's no longer returned)
      const revertStocks = existingReturnLines
        .filter((line) => (line.stock_id ?? 0) > 0)
        .map((line) => ({
          id: line.stock_id as number,
          quantity: line.return_qty,
        }));
      await stockRepository.bulkDecrementStockAndDecrementQtyIn(
        revertStocks,
        tx,
      );

      // Delete return lines and the return document
      await salesReturnLineRepository.deleteBySalesReturnIds([returnId], tx);
      await salesReturnRepository.deleteById(returnId, tx);

      // Recalculate invoice total
      const discount = await saleOrderRepository.getDiscountById(order.id, tx);
      const rawTotal = await saleOrderLineRepository.getSumTotalPriceByOrderId(
        order.id,
        tx,
      );
      const newInvoiceTotal = Math.floor(rawTotal * (1 - discount / 100));

      await saleOrderRepository.updateInvoiceValue(
        newInvoiceTotal,
        order.id,
        tx,
      );

      // Update client balance (increase debt because items are back in the invoice)
      const receivableDelta = newInvoiceTotal - order.invoice_value;
      await clientRepository.incReceivableBalance(
        order.client_id,
        receivableDelta,
        tx,
      );

      return {
        message: "Retur penjualan berhasil dihapus",
      };
    });
  },
};
