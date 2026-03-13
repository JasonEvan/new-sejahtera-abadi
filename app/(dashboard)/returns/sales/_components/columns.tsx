import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil } from "lucide-react";
import { useMemo } from "react";
import EditReturnQtyForm from "./EditReturnQtyForm";
import { SaleReturnTableRow } from "@/modules/sales-return/sales-return.types";

const columnHelper = createColumnHelper<SaleReturnTableRow>();

export const useColumns = () => {
  function handleEditReturnQty(data: SaleReturnTableRow) {
    dialogs.open({
      title: "Edit Jumlah Retur",
      description: "Ubah jumlah barang yang diretur",
      type: "form",
      formId: "edit-return-qty-form",
      children: <EditReturnQtyForm data={data} />,
    });
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama Barang",
      }),

      columnHelper.accessor("price", {
        header: () => <div className="text-right">Harga</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("qty", {
        header: () => <div className="text-right">Jumlah</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("return_qty", {
        header: () => <div className="text-right">Jumlah Retur</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("subtotal", {
        header: () => <div className="text-right">Subtotal</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEditReturnQty(row.original)}
          >
            <Pencil />
          </Button>
        ),
      }),
    ],
    [],
  );

  return columns;
};
