import db from "@/lib/drizzle";
import { purchaseReturnRepository } from "./purchase-return.repository";
import { InsertPurchaseReturn } from "./purchase-return.types";
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
};
