import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSalesperson } from "./salesperson.api";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";
import { addSalespersonKey, getSalespersonsKey } from "./salesperson.keys";

export const useAddSalespersonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: addSalespersonKey(),
    mutationFn: addSalesperson,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message || "Salesman berhasil ditambahkan", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getSalespersonsKey() });
    },
  });
};
