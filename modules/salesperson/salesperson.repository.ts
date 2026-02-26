import { salespersons } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc } from "drizzle-orm";
import { InsertSalesperson } from "./salesperson.types";

export const salespersonRepository = {
  getSalespersons() {
    return db.select().from(salespersons).orderBy(asc(salespersons.name));
  },

  addSalesperson(data: InsertSalesperson) {
    return db.insert(salespersons).values({ ...data, invoice_number: 0 });
  },
};
