import { roleRepository } from "./role.repository";
import { InsertRole } from "./role.types";

export const roleService = {
  getRoles() {
    return roleRepository.getRoles();
  },

  addRole(data: InsertRole) {
    return roleRepository.addRole(data);
  },

  updateRole(id: number, data: Partial<InsertRole>) {
    return roleRepository.updateRole(id, data);
  },

  async deleteRole(id: number) {
    const userCount = await roleRepository.countUsersByRoleId(id);
    if (userCount > 0) {
      throw new Error("Tidak bisa menghapus role yang masih digunakan oleh user");
    }
    return roleRepository.deleteRole(id);
  },

  getRolePermissions(roleId: number) {
    return roleRepository.getRolePermissions(roleId);
  },

  updateRolePermissions(roleId: number, permissionIds: number[]) {
    return roleRepository.updateRolePermissions(roleId, permissionIds);
  },

  getAllPermissions() {
    return roleRepository.getAllPermissions();
  },
};
