import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchase, createPurchaseReturn } from "./purchase.api";
import { toast } from "sonner";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { getClientsKey } from "../client/client.keys";
import { getStocksKey } from "../stock/stock.keys";
import { invalidateOrdersMenuKey } from "./purchase.keys";
import {
  getAllPayablesKey,
  invalidateInventoryLedgersKey,
  invalidateProfitReportKey,
} from "../report/report.keys";
import { usePurchaseReturnStore } from "@/stores/transactions/usePurchaseReturnStore";

export const useCreatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchase,
    onSuccess: (data) => {
      toast.success(data.message || "Purchase created successfully", {
        position: "bottom-right",
      });

      usePurchaseStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
    },
  });
};

export const useCreatePurchaseReturnMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPurchaseReturn,
    onSuccess: (data) => {
      toast.success(data.message || "Retur beli berhasil dibuat", {
        position: "bottom-right",
      });

      usePurchaseReturnStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
    },
  });
};
