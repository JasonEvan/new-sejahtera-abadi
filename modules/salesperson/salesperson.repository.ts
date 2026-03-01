import { salespersons } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { asc, eq, sql } from "drizzle-orm";
import { EditSalesperson, InsertSalesperson } from "./salesperson.types";
import { Tx } from "@/lib/common-types";

export const salespersonRepository = {
  getSalespersons() {
    return db.select().from(salespersons).orderBy(asc(salespersons.name));
  },

  getSalespersonNames() {
    return db
      .select({
        id: salespersons.id,
        name: salespersons.name,
        invoice_number: salespersons.invoice_number,
        front_number: salespersons.front_number,
      })
      .from(salespersons)
      .orderBy(asc(salespersons.name));
  },

  addSalesperson(data: InsertSalesperson) {
    return db.insert(salespersons).values({ ...data, invoice_number: 0 });
  },

  updateSalesperson(id: number, data: EditSalesperson) {
    return db.update(salespersons).set(data).where(eq(salespersons.id, id));
  },

  deleteSalesperson(id: number) {
    return db.delete(salespersons).where(eq(salespersons.id, id));
  },

  incInvoiceNumber(id: number, tx?: Tx) {
    const database = tx ?? db;
    return database
      .update(salespersons)
      .set({
        invoice_number: sql`${salespersons.invoice_number} + 1`,
      })
      .where(eq(salespersons.id, id));
  },
};
