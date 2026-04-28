import { roles, users, role_permissions, permissions } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, count } from "drizzle-orm";
import { InsertRole } from "./role.types";

export const roleRepository = {
  getRoles() {
    return db
      .select({
        id: roles.id,
        name: roles.name,
        permissionsCount: count(role_permissions.permission_id),
      })
      .from(roles)
      .leftJoin(role_permissions, eq(roles.id, role_permissions.role_id))
      .groupBy(roles.id)
      .orderBy(asc(roles.name));
  },

  addRole(data: InsertRole) {
    return db.insert(roles).values(data);
  },

  updateRole(id: number, data: Partial<InsertRole>) {
    return db.update(roles).set(data).where(eq(roles.id, id));
  },

  async deleteRole(id: number) {
    return await db.transaction(async (tx) => {
      // 1. Delete associated permissions
      await tx.delete(role_permissions).where(eq(role_permissions.role_id, id));
      // 2. Delete role
      await tx.delete(roles).where(eq(roles.id, id));
    });
  },

  async countUsersByRoleId(roleId: number) {
    const result = await db
      .select({ value: count() })
      .from(users)
      .where(eq(users.role_id, roleId));
    return result[0].value;
  },

  async getRolePermissions(roleId: number) {
    return db
      .select({
        id: permissions.id,
        name: permissions.name,
      })
      .from(permissions)
      .innerJoin(
        role_permissions,
        eq(permissions.id, role_permissions.permission_id),
      )
      .where(eq(role_permissions.role_id, roleId));
  },

  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    return await db.transaction(async (tx) => {
      // 1. Delete all existing permissions for this role
      await tx.delete(role_permissions).where(eq(role_permissions.role_id, roleId));

      // 2. Insert new permissions if any
      if (permissionIds.length > 0) {
        await tx.insert(role_permissions).values(
          permissionIds.map((pId) => ({
            role_id: roleId,
            permission_id: pId,
          })),
        );
      }
    });
  },

  getAllPermissions() {
    return db.select().from(permissions).orderBy(asc(permissions.name));
  },
};
