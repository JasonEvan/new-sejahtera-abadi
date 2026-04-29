import { permissions, role_permissions, roles, users } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { InsertUser } from "./user.types";
import { asc, eq } from "drizzle-orm";

export const userRepository = {
  getUsers() {
    return db
      .select({
        id: users.id,
        email: users.email,
        role: roles.name,
        role_id: users.role_id,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .orderBy(asc(users.id));
  },

  addUser(data: InsertUser) {
    return db.insert(users).values(data);
  },

  updateUser(id: number, data: Partial<InsertUser>) {
    return db.update(users).set(data).where(eq(users.id, id));
  },

  deleteUser(id: number) {
    return db.delete(users).where(eq(users.id, id));
  },

  async getUserByEmail(email: string) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        role: roles.name,
        role_id: users.role_id,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.email, email))
      .limit(1);

    const user = result[0];
    if (!user) return null;

    // Fetch permissions if user has a role
    let userPermissions: string[] = [];
    if (user.role_id) {
      const perms = await db
        .select({
          name: permissions.name,
        })
        .from(permissions)
        .innerJoin(
          role_permissions,
          eq(permissions.id, role_permissions.permission_id),
        )
        .where(eq(role_permissions.role_id, user.role_id));

      userPermissions = perms.map((p) => p.name);
    }

    return {
      ...user,
      permissions: userPermissions,
    };
  },

  async getUserById(id: number) {
    const result = await db
      .select({
        id: users.id,
        email: users.email,
        password: users.password,
        role: roles.name,
        role_id: users.role_id,
      })
      .from(users)
      .leftJoin(roles, eq(users.role_id, roles.id))
      .where(eq(users.id, id))
      .limit(1);

    const user = result[0];
    if (!user) return null;

    // Fetch permissions if user has a role
    let userPermissions: string[] = [];
    if (user.role_id) {
      const perms = await db
        .select({
          name: permissions.name,
        })
        .from(permissions)
        .innerJoin(
          role_permissions,
          eq(permissions.id, role_permissions.permission_id),
        )
        .where(eq(role_permissions.role_id, user.role_id));

      userPermissions = perms.map((p) => p.name);
    }

    return {
      ...user,
      permissions: userPermissions,
    };
  },
};
