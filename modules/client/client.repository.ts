import { clients } from "@/drizzle/schema";
import db from "@/lib/drizzle";
import { InsertClient } from "./client.types";

export const clientRepository = {
  getClients() {
    return db
      .select({
        id: clients.id,
        name: clients.name,
        city: clients.city,
        phone: clients.phone,
        mobile_phone: clients.mobile_phone,
      })
      .from(clients);
  },

  addClient(data: InsertClient) {
    return db.insert(clients).values(data);
  },
};
