import { salespersons } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc } from "drizzle-orm";

export const salespersonRepository = {
  getSalespersons() {
    return db.select().from(salespersons).orderBy(asc(salespersons.name));
  },
};
