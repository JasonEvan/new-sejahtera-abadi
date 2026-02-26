import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addSalesperson, editSalesperson } from "./salesperson.api";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";
import {
  addSalespersonKey,
  editSalespersonKey,
  getSalespersonsKey,
} from "./salesperson.keys";

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

export const useEditSalespersonMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: editSalespersonKey(),
    mutationFn: editSalesperson,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message || "Salesman berhasil diperbarui", {
        position: "bottom-right",
      });
      queryClient.invalidateQueries({ queryKey: getSalespersonsKey() });
    },
  });
};
