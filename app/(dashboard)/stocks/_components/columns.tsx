import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { Stock } from "@/modules/stock/stock.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import StockForm from "./StockForm";
import { updateStockKey } from "@/modules/stock/stock.keys";

const columnHelper = createColumnHelper<Stock>();

export const useColumns = () => {
  function handleEditStock(stock: Stock) {
    dialogs.open({
      title: "Edit Stock",
      description: "Ubah informasi stock",
      type: "form",
      formId: "add-stock-form",
      mutationKey: updateStockKey(),
      children: <StockForm stock={stock} />,
    });
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama Barang",
      }),

      columnHelper.accessor("product_price", {
        header: () => <div className="text-right">Harga Beli</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("selling_price", {
        header: () => <div className="text-right">Harga Jual</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue()?.toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("unit", {
        header: "Satuan",
      }),

      columnHelper.accessor("capital_cost", {
        header: () => <div className="text-right">Modal</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue()?.toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditStock(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => {}}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      }),
    ],
    [],
  );

  return columns;
};
