import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addStock } from "./stock.api";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";
import { getStocksKey } from "./stock.keys";

export const useAddStockMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
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
