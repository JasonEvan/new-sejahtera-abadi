import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { SaleTableRow } from "@/modules/sale/sale.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import EditItemForm from "./EditItemForm";

const columnHelper = createColumnHelper<SaleTableRow>();

export const useColumns = () => {
  function handleStockEdit(data: SaleTableRow) {
    dialogs.open({
      title: "Edit Item",
      description: "Ubah item yang dijual",
      type: "form",
      formId: "edit-item-form",
      children: <EditItemForm data={data} />,
    });
  }

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

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleStockEdit(row.original)}
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
