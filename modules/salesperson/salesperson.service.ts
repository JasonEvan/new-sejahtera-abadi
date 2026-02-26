import { salespersonRepository } from "./salesperson.repository";
import { InsertSalesperson } from "./salesperson.types";

export const salespersonService = {
  getSalespersons() {
    return salespersonRepository.getSalespersons();
  },

  addSalesperson(data: InsertSalesperson) {
    return salespersonRepository.addSalesperson(data);
  },
};
