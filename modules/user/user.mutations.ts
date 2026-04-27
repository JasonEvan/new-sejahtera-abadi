import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addUser, deleteUser, editUser } from "./user.api";
import { addUserKey, editUserKey, getUsersKey } from "./user.keys";
import { toast } from "sonner";
import { dialogs } from "@/lib/dialogs";

export const useAddUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: addUserKey(),
    mutationFn: addUser,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getUsersKey() });
    },
  });
};

export const useEditUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: editUserKey(),
    mutationFn: editUser,
    onSuccess: (data) => {
      dialogs.close();
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getUsersKey() });
    },
  });
};

export const useDeleteUserMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: (data) => {
      toast.success(data.message, { position: "bottom-right" });
      queryClient.invalidateQueries({ queryKey: getUsersKey() });
    },
  });
};
