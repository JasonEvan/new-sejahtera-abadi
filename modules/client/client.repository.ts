import { clients } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { InsertClient } from "./client.types";
import { asc, eq } from "drizzle-orm";

export const clientRepository = {
  getClients() {
    return db
      .select({
        id: clients.id,
        name: clients.name,
        city: clients.city,
        address: clients.address,
        phone: clients.phone,
        mobile_phone: clients.mobile_phone,
      })
      .from(clients)
      .orderBy(asc(clients.name), asc(clients.city));
  },

  getNames() {
    return db
      .select({
        id: clients.id,
        name: clients.name,
        city: clients.city,
      })
      .from(clients)
      .orderBy(asc(clients.name), asc(clients.city));
  },

  addClient(data: InsertClient) {
    return db.insert(clients).values(data);
  },

  updateClient(id: number, data: InsertClient) {
    return db.update(clients).set(data).where(eq(clients.id, id));
  },

  deleteClient(id: number) {
    return db.delete(clients).where(eq(clients.id, id));
  },
};
