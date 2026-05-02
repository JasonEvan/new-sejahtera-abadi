import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createPurchase,
  createPurchaseReturn,
  updatePurchase,
} from "./purchase.api";
import { toast } from "sonner";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { useEditPurchaseStore } from "@/stores/transactions/useEditPurchaseStore";
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
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
    },
  });
};

export const useUpdatePurchaseMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      purchaseOrderId,
      data,
    }: {
      purchaseOrderId: number;
      data: Parameters<typeof updatePurchase>[1];
    }) => updatePurchase(purchaseOrderId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Nota pembelian berhasil diupdate", {
        position: "bottom-right",
      });

      useEditPurchaseStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllPayablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
    },
  });
};
