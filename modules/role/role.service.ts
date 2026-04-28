import { roleRepository } from "./role.repository";

export const roleService = {
  getRoles() {
    return roleRepository.getRoles();
  },
};
