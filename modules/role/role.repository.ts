import { roles } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc } from "drizzle-orm";

export const roleRepository = {
  getRoles() {
    return db.select().from(roles).orderBy(asc(roles.name));
  },
};
