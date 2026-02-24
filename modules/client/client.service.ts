import { clientRepository } from "./client.repository";

export const clientService = {
  getClients() {
    return clientRepository.getClients();
  },
};
