import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addClient } from "./client.api";
import { addClientKey, getClientsKey } from "./client.keys";
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
