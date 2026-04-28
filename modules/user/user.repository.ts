import { roles, users } from "@/drizzle/schema";
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

    return result[0];
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

    return result[0];
  },
};
