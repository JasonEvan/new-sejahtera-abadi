import { clientRepository } from "./client.repository";
import { InsertClient } from "./client.types";

export const clientService = {
  getClients() {
    return clientRepository.getClients();
  },

  addClient(data: InsertClient) {
    return clientRepository.addClient(data);
  },
};
