import z from "zod";
import { EditSaleItemRow } from "@/stores/transactions/useEditSaleStore";

type StockMenuItem = {
  id: number;
  name: string;
  ending_stock: number;
  selling_price: number | null;
};

export const createEditSaleItemValidation = ({
  stocks,
  items,
  baseQuantitiesByStock,
  editingRowId,
}: {
  stocks: StockMenuItem[];
  items: EditSaleItemRow[];
  baseQuantitiesByStock: Record<number, number>;
  editingRowId?: string;
}) =>
  z
    .object({
      stock_id: z.int().min(1, "Pilih produk"),
      selling_price: z
        .number()
        .min(0, "Harga harus lebih dari atau sama dengan 0"),
      quantity: z.int().min(1, "Jumlah harus lebih dari 0"),
    })
    .refine(
      (data) => {
        const selectedStock = stocks.find(
          (stock) => stock.id === data.stock_id,
        );
        if (!selectedStock) {
          return false;
        }

        const usedByOtherRows = items
          .filter((item) => item.stock_id === data.stock_id)
          .filter((item) => item.id !== editingRowId)
          .reduce((acc, curr) => acc + curr.quantity, 0);

        const baseQuantity = baseQuantitiesByStock[data.stock_id] || 0;
        const maxAllowed = Math.max(
          selectedStock.ending_stock + baseQuantity - usedByOtherRows,
          0,
        );

        return data.quantity <= maxAllowed;
      },
      {
        error: "Jumlah melebihi stok yang tersedia",
        path: ["quantity"],
      },
    );
