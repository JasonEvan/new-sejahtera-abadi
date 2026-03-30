import db from "@/lib/drizzle";
import { salesReturnRepository } from "./sales-return.repository";
import { InsertSaleReturn, UpdateSaleReturn } from "./sales-return.types";
import { AppError } from "@/lib/errors";
import { salesReturnLineRepository } from "./sales-return-line.repository";
import { saleOrderLineRepository } from "../sale/sale-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { clientRepository } from "../client/client.repository";

export const salesReturnService = {
  createSalesReturn(data: InsertSaleReturn) {
    return db.transaction(async (tx) => {
      const hasReturn = await salesReturnRepository.hasReturnForSalesOrder(
        data.sales_order_id,
        tx,
      );
      if (hasReturn) {
        throw new AppError(
          "Retur penjualan untuk nota ini sudah ada, gunakan menu edit retur",
          400,
        );
      }

      const [insertedReturn] = await salesReturnRepository.createSalesReturn(
        data,
        tx,
      );
      if (!insertedReturn) {
        throw new AppError("Failed to create sales return", 500);
      }

      const salesOrderLineIds = data.lines.map((l) => l.sales_order_line_id);
      const lineDetails = await saleOrderLineRepository.getLineDetails(
        salesOrderLineIds,
        tx,
      );

      const enrichedLines = data.lines.map((line) => {
        const detail = lineDetails.find(
          (d) => d.id === line.sales_order_line_id,
        );
        if (!detail)
          throw new AppError(
            `Order line ${line.sales_order_line_id} not found`,
            404,
          );
        return {
          sales_order_line_id: line.sales_order_line_id,
          return_qty: line.return_qty,
          price: detail.price,
          stock_id: detail.stock_id ?? 0,
        };
      });

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

      const decrementStock = enrichedLines.map((l) => ({
        id: l.stock_id,
        quantity: l.return_qty,
      }));
      await stockRepository.bulkIncrementStockAndIncrementQtyIn(
        decrementStock,
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

      const oldInvoiceValue = await saleOrderRepository.getInvoiceValueById(
        data.sales_order_id,
        tx,
      );

      const newTotal = Math.floor(rawTotal * (1 - discount / 100));
      await saleOrderRepository.updateInvoiceValue(
        newTotal,
        data.sales_order_id,
        tx,
      );

      const reduction = newTotal - oldInvoiceValue;
      await clientRepository.incReceivableBalance(
        data.client_id,
        reduction,
        tx,
      );
    });
  },

  getUnpaidReturnedInvoices() {
    return salesReturnRepository.getUnpaidReturnedInvoices();
  },

  async getEditSaleReturnDetail(invoiceNumber: string) {
    const data =
      await salesReturnRepository.getEditSaleReturnDetailByInvoice(
        invoiceNumber,
      );

    if (!data) {
      throw new AppError("Invoice retur tidak ditemukan", 404);
    }

    return data;
  },

  updateSaleReturn(data: UpdateSaleReturn) {
    return db.transaction(async (tx) => {
      const normalizedInvoice = data.invoice_number.trim().toUpperCase();

      const order = await saleOrderRepository.getByInvoiceNumber(
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

      const existingReturns = await salesReturnRepository.getBySalesOrderId(
        order.id,
        tx,
      );
      if (existingReturns.length === 0) {
        throw new AppError("Data retur penjualan tidak ditemukan", 404);
      }

      const existingReturnIds = existingReturns.map((row) => row.id);

      const existingReturnLines =
        await salesReturnLineRepository.getBySalesReturnIds(
          existingReturnIds,
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
        existingReturnIds,
        tx,
      );
      await salesReturnRepository.deleteBySalesOrderId(order.id, tx);

      const latestOrderLines = await saleOrderLineRepository.getBySalesOrderId(
        order.id,
        tx,
      );

      const lineQtyById = new Map(
        latestOrderLines.map((line) => [line.id, line.qty]),
      );
      const availableLineIds = new Set(latestOrderLines.map((line) => line.id));
      for (const line of data.lines) {
        if (!availableLineIds.has(line.sales_order_line_id)) {
          throw new AppError(
            `Order line ${line.sales_order_line_id} does not belong to selected invoice`,
            400,
          );
        }

        const currentQty = lineQtyById.get(line.sales_order_line_id) ?? 0;
        if (line.return_qty > currentQty) {
          throw new AppError(
            `Jumlah retur melebihi jumlah barang pada line ${line.sales_order_line_id}`,
            400,
          );
        }
      }

      const returnableLines = data.lines.filter((line) => line.return_qty > 0);
      if (returnableLines.length === 0) {
        throw new AppError("Pilih minimal 1 item untuk diretur", 400);
      }

      const lineIds = returnableLines.map((line) => line.sales_order_line_id);
      const lineDetails = await saleOrderLineRepository.getLineDetails(
        lineIds,
        tx,
      );

      const enrichedLines = returnableLines.map((line) => {
        const detail = lineDetails.find(
          (item) => item.id === line.sales_order_line_id,
        );
        if (!detail) {
          throw new AppError(
            `Order line ${line.sales_order_line_id} not found`,
            404,
          );
        }

        return {
          sales_order_line_id: line.sales_order_line_id,
          return_qty: line.return_qty,
          price: detail.price,
          stock_id: detail.stock_id ?? 0,
        };
      });

      const [insertedReturn] = await salesReturnRepository.createSalesReturn(
        {
          client_id: order.client_id,
          sales_order_id: order.id,
          return_date: data.return_date,
          lines: returnableLines,
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
        message: "Sales return updated successfully",
      };
    });
  },
};
