import db from "@/lib/drizzle";
import { InsertPurchase } from "./purchase.types";
import { purchaseOrderRepository } from "./purchase-order.repository";
import { AppError } from "@/lib/errors";
import { purchaseOrderLineRepository } from "./purchase-order-line.repository";
import { stockRepository } from "../stock/stock.repository";
import { clientRepository } from "../client/client.repository";

export const purchaseService = {
  createPurchase(data: InsertPurchase) {
    return db.transaction(async (tx) => {
      const newPurchaseOrder =
        await purchaseOrderRepository.insertPurchaseOrder(data, tx);

      if (newPurchaseOrder.length === 0) {
        throw new AppError("Failed to create purchase order", 500);
      }

      await purchaseOrderLineRepository.insertPurchaseOrderLine(
        data,
        newPurchaseOrder[0].id,
        tx,
      );

      const mappedData = data.cart.map((item) => ({
        id: item.stock_id,
        quantity: item.quantity,
      }));

      await stockRepository.bulkIncrementStockAndIncrementQtyIn(mappedData, tx);
      await clientRepository.incPayableBalance(data.client_id, data.total, tx);
    });
  },
};
