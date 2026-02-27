import { SaleTableRow } from "@/modules/sale/sale.types";
import { createColumnHelper } from "@tanstack/react-table";
import { useMemo } from "react";

const columnHelper = createColumnHelper<SaleTableRow>();

export const useColumns = () => {
  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama Barang",
      }),

      columnHelper.accessor("selling_price", {
        header: "Harga Jual",
      }),

      columnHelper.accessor("capital_cost", {
        header: "Modal",
      }),

      columnHelper.accessor("quantity", {
        header: "Jumlah",
      }),

      columnHelper.accessor("subtotal", {
        header: "Subtotal",
      }),
    ],
    [],
  );

  return columns;
};
