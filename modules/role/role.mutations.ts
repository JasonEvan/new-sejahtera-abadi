import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addRole,
  deleteRole,
  editRole,
  updateRolePermissions,
} from "./role.api";
import {
  addRoleKey,
  deleteRoleKey,
  editRoleKey,
  getRolesKey,
  updateRolePermissionsKey,
} from "./role.keys";
import { toast } from "sonner";

export const useAddRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: addRoleKey(),
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
    mutationKey: editRoleKey(),
    mutationFn: editRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      toast.success(data.message);
    },
  });
};

export const useDeleteRoleMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: deleteRoleKey(),
    mutationFn: deleteRole,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: getRolesKey() });
      toast.success(data.message);
    },
  });
};

export const useUpdateRolePermissionsMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationKey: updateRolePermissionsKey(),
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
  });
};
