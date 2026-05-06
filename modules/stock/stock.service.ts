import { AppError } from "@/lib/errors";
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

  async deleteStock(id: number) {
    const stock = await stockRepository.getStockById(id);

    if (!stock) {
      throw new AppError("Data stok tidak ditemukan", 404);
    }

    if (stock.initial_stock !== 0 || stock.ending_stock !== 0) {
      throw new AppError("Stok awal dan stok akhir harus 0", 400);
    }

    if (stock.qty_in !== 0 || stock.qty_out !== 0) {
      throw new AppError("Masih ada transaksi dengan barang ini", 400);
    }

    return stockRepository.deleteStock(id);
  },
};
