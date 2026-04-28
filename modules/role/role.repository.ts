import { roles, users, role_permissions } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, count } from "drizzle-orm";
import { InsertRole } from "./role.types";

export const roleRepository = {
  getRoles() {
    return db.select().from(roles).orderBy(asc(roles.name));
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
};
