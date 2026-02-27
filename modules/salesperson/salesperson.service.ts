import { salespersonRepository } from "./salesperson.repository";
import { EditSalesperson, InsertSalesperson } from "./salesperson.types";

export const salespersonService = {
  getSalespersons(nameOnly: boolean = false) {
    if (nameOnly) {
      return salespersonRepository.getSalespersonNames();
    }

    return salespersonRepository.getSalespersons();
  },

  addSalesperson(data: InsertSalesperson) {
    return salespersonRepository.addSalesperson(data);
  },

  updateSalesperson(id: number, data: EditSalesperson) {
    return salespersonRepository.updateSalesperson(id, data);
  },

  deleteSalesperson(id: number) {
    return salespersonRepository.deleteSalesperson(id);
  },
};
