import db from "@/lib/drizzle";
import { systemRepository } from "./system.repository";

export const systemService = {
  async performYearlyCutoff(endDate: Date) {
    return db.transaction(async (tx) => {
      // 1. Fetch paid sales orders and purchase orders
      const salesToDelete = await systemRepository.getPaidSalesOrders(
        endDate,
        tx,
      );
      const purchasesToDelete = await systemRepository.getPaidPurchaseOrders(
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

      // 4. Shift balances using a single Bulk Update query
      await systemRepository.bulkShiftStockBalances(stockMovements, tx);

      // 5. Delete transactions cascadingly
      await systemRepository.bulkDeleteSalesOrders(salesIds, tx);
      await systemRepository.bulkDeletePurchaseOrders(purchaseIds, tx);

      return { success: true };
    });
  },

  async getUnpaidOrdersSummary(endDate: Date) {
    return systemRepository.getUnpaidOrdersSummary(endDate);
  },
};
