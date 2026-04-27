import { users } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { InsertUser } from "./user.types";
import { asc, eq } from "drizzle-orm";

export const userRepository = {
  getUsers() {
    return db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
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

  getUserByEmail(email: string) {
    return db.query.users.findFirst({
      where: eq(users.email, email),
    });
  },

  getUserById(id: number) {
    return db.query.users.findFirst({
      where: eq(users.id, id),
    });
  },
};
