import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addStock, updateStock } from "./stock.api";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";
import { addStockKey, getStocksKey, updateStockKey } from "./stock.keys";

export const useAddStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: addStockKey(),
    mutationFn: addStock,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message || "Stock berhasil ditambahkan", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
    },
  });
};

export const useEditStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateStockKey(),
    mutationFn: updateStock,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message || "Stock berhasil diperbarui", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getStocksKey() });
    },
  });
};
