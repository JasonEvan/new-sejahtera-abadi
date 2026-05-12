import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createSale,
  createSaleReturn,
  updateSale,
  deleteSale,
} from "./sale.api";
import { toast } from "sonner";
import { getClientsKey } from "../client/client.keys";
import {
  getSalespersonNamesKey,
  getSalespersonsKey,
} from "../salesperson/salesperson.keys";
import { getStocksKey } from "../stock/stock.keys";
import { useSaleStore } from "@/stores/transactions/useSaleStore";
import { useSaleReturnStore } from "@/stores/transactions/useSaleReturnStore";
import { useEditSaleStore } from "@/stores/transactions/useEditSaleStore";
import { useDeleteSaleStore } from "@/stores/transactions/useDeleteSaleStore";
import { invalidateOrdersMenuKey } from "./sale.keys";
import {
  getAllReceivablesKey,
  invalidateInventoryLedgersKey,
  invalidateProfitReportKey,
} from "../report/report.keys";

export const useCreateSaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSale,
    onSuccess: (data) => {
      toast.success(data.message || "Faktur berhasil dibuat", {
        position: "bottom-right",
      });

      useSaleStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getSalespersonsKey() });
      queryClient.invalidateQueries({ queryKey: getSalespersonNamesKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
    },
  });
};

export const useCreateSaleReturnMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSaleReturn,
    onSuccess: (data) => {
      toast.success(data.message || "Retur jual berhasil dibuat", {
        position: "bottom-right",
      });

      useSaleReturnStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
    },
  });
};

export const useUpdateSaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      salesOrderId,
      data,
    }: {
      salesOrderId: number;
      data: Parameters<typeof updateSale>[1];
    }) => updateSale(salesOrderId, data),
    onSuccess: (response) => {
      toast.success(response.message || "Nota penjualan berhasil diupdate", {
        position: "bottom-right",
      });

      useEditSaleStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
    },
  });
};

export const useDeleteSaleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (salesOrderId: number) => deleteSale(salesOrderId),
    onSuccess: (response) => {
      toast.success(response.message || "Nota penjualan berhasil dihapus", {
        position: "bottom-right",
      });

      useDeleteSaleStore.getState().clear();

      queryClient.invalidateQueries({ queryKey: getClientsKey() });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
      queryClient.invalidateQueries({ queryKey: invalidateOrdersMenuKey() });
      queryClient.invalidateQueries({ queryKey: getAllReceivablesKey() });
      queryClient.invalidateQueries({ queryKey: invalidateProfitReportKey() });
      queryClient.invalidateQueries({
        queryKey: invalidateInventoryLedgersKey(),
      });
    },
  });
};
