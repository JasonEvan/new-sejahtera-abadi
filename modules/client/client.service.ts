import { clientRepository } from "./client.repository";
import { InsertClient } from "./client.types";

export const clientService = {
  getClients(nameOnly: boolean = false) {
    if (nameOnly) {
      return clientRepository.getNames();
    }

    return clientRepository.getClients();
  },

  addClient(data: InsertClient) {
    return clientRepository.addClient(data);
  },

  updateClient(id: number, data: InsertClient) {
    return clientRepository.updateClient(id, data);
  },

  deleteClient(id: number) {
    return clientRepository.deleteClient(id);
  },
};
