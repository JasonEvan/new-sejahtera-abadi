import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSale } from "./sale.api";
import { toast } from "sonner";
import { getClientsKey } from "../client/client.keys";
import {
  getSalespersonNamesKey,
  getSalespersonsKey,
} from "../salesperson/salesperson.keys";
import { getStocksKey } from "../stock/stock.keys";
import { useSaleStore } from "@/stores/transactions/useSaleStore";

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
    },
  });
};
