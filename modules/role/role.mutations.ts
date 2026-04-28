import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRole, deleteRole, editRole } from "./role.api";
import { getRolesKey } from "./role.keys";
import { toast } from "sonner";

export const useAddRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal menambahkan role");
    },
  });
};

export const useEditRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: editRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal memperbarui role");
    },
  });
};

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal menghapus role");
    },
  });
};
