import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateSaleReturn } from "./sales-return.api";
import { toast } from "sonner";
import { useEditSaleReturnStore } from "@/stores/transactions/useEditSaleReturnStore";
import { getClientsKey } from "../client/client.keys";
import { getStocksKey } from "../stock/stock.keys";
import { invalidateOrdersMenuKey } from "../sale/sale.keys";
import {
  getAllReceivablesKey,
  invalidateInventoryLedgersKey,
  invalidateProfitReportKey,
} from "../report/report.keys";
import { getEditSaleReturnInvoicesKey } from "./sales-return.keys";

export const useUpdateSaleReturnMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSaleReturn,
    onSuccess: (data) => {
      toast.success(data.message || "Retur jual berhasil diupdate", {
        position: "bottom-right",
      });

      useEditSaleReturnStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
      queryClient.invalidateQueries({
        queryKey: getEditSaleReturnInvoicesKey(),
      });
      queryClient.invalidateQueries({ queryKey: ["edit-sale-return-detail"] });
    },
  });
};
