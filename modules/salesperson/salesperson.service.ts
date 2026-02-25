import { salespersonRepository } from "./salesperson.repository";

export const salespersonService = {
  getSalespersons() {
    return salespersonRepository.getSalespersons();
  },
};
