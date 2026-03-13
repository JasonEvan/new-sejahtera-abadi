import db from "@/lib/drizzle";
import { salesReturnRepository } from "./sales-return.repository";
import { InsertSaleReturn } from "./sales-return.types";
import { AppError } from "@/lib/errors";
import { salesReturnLineRepository } from "./sales-return-line.repository";
import { saleOrderLineRepository } from "../sale/sale-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { saleOrderRepository } from "../sale/sale-order.repository";
import { clientRepository } from "../client/client.repository";

export const salesReturnService = {
  createSalesReturn(data: InsertSaleReturn) {
    return db.transaction(async (tx) => {
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
};
