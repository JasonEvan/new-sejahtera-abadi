import { stockRepository } from "./stock.repository";

export const stockService = {
  getAllStocks() {
    return stockRepository.getAllStocks();
  },
};
