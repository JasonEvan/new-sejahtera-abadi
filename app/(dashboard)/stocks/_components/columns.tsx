import { Stock } from "@/modules/stock/stock.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<Stock>();

export const columns = [
  columnHelper.accessor("name", {
    header: "Nama Barang",
  }),

  columnHelper.accessor("product_price", {
    header: "Harga Beli",
  }),

  columnHelper.accessor("selling_price", {
    header: "Harga Jual",
  }),

  columnHelper.accessor("unit", {
    header: "Satuan",
  }),

  columnHelper.accessor("capital_cost", {
    header: "Modal",
  }),
];
