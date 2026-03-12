import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPurchase } from "./purchase.api";
import { toast } from "sonner";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { getClientsKey } from "../client/client.keys";
import { getStocksKey } from "../stock/stock.keys";
import { invalidateOrdersMenuKey } from "./purchase.keys";
import {
  getAllPayablesKey,
  invalidateInventoryLedgersKey,
} from "../report/report.keys";

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
