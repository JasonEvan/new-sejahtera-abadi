import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addClient, deleteClient, editClient } from "./client.api";
import { addClientKey, editClientKey, getClientsKey } from "./client.keys";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";

export const useAddClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: addClientKey(),
    mutationFn: addClient,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getClientsKey() });
    },
  });
};

export const useEditClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: editClientKey(),
    mutationFn: editClient,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getClientsKey() });
    },
  });
};

export const useDeleteClientMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteClient,
    onSuccess: (data) => {
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getClientsKey() });
    },
  });
};
