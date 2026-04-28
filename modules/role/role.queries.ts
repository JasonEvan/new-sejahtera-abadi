import { useQuery } from "@tanstack/react-query";
import { getRoles, getPermissions, getRolePermissions } from "./role.api";
import { getRolesKey } from "./role.keys";

export const useGetRoles = () => {
  return useQuery({
    queryKey: getRolesKey(),
    queryFn: async () => {
      const response = await getRoles();
      return response.data;
    },
  });
};

export const useGetPermissions = () => {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const response = await getPermissions();
      return response.data;
    },
  });
};

export const useGetRolePermissions = (roleId: number) => {
  return useQuery({
    queryKey: ["role-permissions", roleId],
    queryFn: async () => {
      const response = await getRolePermissions(roleId);
      return response.data;
    },
    enabled: !!roleId,
  });
};
