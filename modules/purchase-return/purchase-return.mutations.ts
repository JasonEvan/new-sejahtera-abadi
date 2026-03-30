import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updatePurchaseReturn } from "./purchase-return.api";
import { toast } from "sonner";
import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import { getClientsKey } from "../client/client.keys";
import { getStocksKey } from "../stock/stock.keys";
import { invalidateOrdersMenuKey } from "../purchase/purchase.keys";
import {
  getAllPayablesKey,
  invalidateInventoryLedgersKey,
  invalidateProfitReportKey,
} from "../report/report.keys";
import { getEditPurchaseReturnInvoicesKey } from "./purchase-return.keys";

export const useUpdatePurchaseReturnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchaseReturn,
    onSuccess: (data) => {
      toast.success(data.message || "Retur beli berhasil diupdate", {
        position: "bottom-right",
      });

      useEditPurchaseReturnStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getEditPurchaseReturnInvoicesKey(),
      });
      queryClient.invalidateQueries({
        queryKey: ["edit-purchase-return-detail"],
      });
    },
  });
};
