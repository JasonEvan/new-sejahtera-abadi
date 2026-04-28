import { useMutation, useQueryClient } from "@tanstack/react-query";
import { addRole, deleteRole, editRole, updateRolePermissions } from "./role.api";
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

export const useUpdateRolePermissionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      roleId,
      permissionIds,
    }: {
      roleId: number;
      permissionIds: number[];
    }) => updateRolePermissions(roleId, permissionIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      queryClient.invalidateQueries({
        queryKey: ["role-permissions", variables.roleId],
      });
      toast.success(data.message);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || "Gagal memperbarui permission");
    },
  });
};
