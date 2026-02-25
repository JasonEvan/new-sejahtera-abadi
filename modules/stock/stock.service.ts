import { stockRepository } from "./stock.repository";
import { InsertStock } from "./stock.types";

export const stockService = {
  getAllStocks() {
    return stockRepository.getAllStocks();
  },

  addStock(data: InsertStock) {
    return stockRepository.addStock(data);
  },
};
