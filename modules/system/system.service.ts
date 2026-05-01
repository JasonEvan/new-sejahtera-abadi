import db from "@/lib/drizzle";
import { systemRepository } from "./system.repository";

export const systemService = {
  async performYearlyCutoff(startDate: Date, endDate: Date) {
    return db.transaction(async (tx) => {
      // 1. Fetch paid sales orders and purchase orders
      const salesToDelete = await systemRepository.getPaidSalesOrders(
        startDate,
        endDate,
        tx,
      );
      const purchasesToDelete = await systemRepository.getPaidPurchaseOrders(
        startDate,
        endDate,
        tx,
      );

      const salesIds = salesToDelete.map((so) => so.id);
      const purchaseIds = purchasesToDelete.map((po) => po.id);

      // 2. Early return if both arrays are empty
      if (salesIds.length === 0 && purchaseIds.length === 0) {
        return { success: true, message: "No data to cut off" };
      }

      // 3. Get aggregated movements for those IDs
      const stockMovements = await systemRepository.getDeletedStockMovements(
        salesIds,
        purchaseIds,
        tx,
      );

      // 4. Loop through movements and shift balances
      for (const movement of stockMovements) {
        if (movement.qtyIn === 0 && movement.qtyOut === 0) continue;

        await systemRepository.shiftStockBalances(
          movement.stockId,
          movement.qtyIn,
          movement.qtyOut,
          tx,
        );
      }

      // 5. Delete transactions cascadingly
      for (const soId of salesIds) {
        await systemRepository.deleteSalesOrderCascading(soId, tx);
      }

      for (const poId of purchaseIds) {
        await systemRepository.deletePurchaseOrderCascading(poId, tx);
      }

      return { success: true };
    });
  },
};
