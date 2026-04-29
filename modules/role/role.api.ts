import api from "@/lib/axios";
import { Role, InsertRole, Permission } from "./role.types";

export async function getRoles() {
  const response = await api.get<{ data: Role[] }>("/roles");
  return response.data;
}

export async function addRole(data: InsertRole) {
  const response = await api.post<{ message: string }>("/roles", data);
  return response.data;
}

export async function editRole({ id, data }: { id: number; data: InsertRole }) {
  const response = await api.put<{ message: string }>(`/roles/${id}`, data);
  return response.data;
}

export async function deleteRole(id: number) {
  const response = await api.delete<{ message: string }>(`/roles/${id}`);
  return response.data;
}

export async function getPermissions() {
  const response = await api.get<{ data: Permission[] }>("/permissions");
  return response.data;
}

export async function getRolePermissions(roleId: number) {
  const response = await api.get<{ data: Permission[] }>(
    `/roles/${roleId}/permissions`,
  );
  return response.data;
}

export async function updateRolePermissions(
  roleId: number,
  permissionIds: number[],
) {
  const response = await api.put<{ message: string }>(
    `/roles/${roleId}/permissions`,
    {
      permissionIds,
    },
  );
  return response.data;
}
