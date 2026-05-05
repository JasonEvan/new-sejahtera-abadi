import { stockRepository } from "./stock.repository";
import { InsertStock } from "./stock.types";

export const stockService = {
  getAllStocks() {
    return stockRepository.getAllStocks();
  },

  addStock(data: InsertStock) {
    return stockRepository.addStock(data);
  },

  updateStock(id: number, data: Partial<InsertStock>) {
    return stockRepository.updateStock(id, data);
  },

  deleteStock(id: number) {
    return stockRepository.deleteStock(id);
  },
};
