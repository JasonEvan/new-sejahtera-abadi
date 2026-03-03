import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { SaleTableRow } from "@/modules/sale/sale.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import EditItemForm from "./EditItemForm";
import { alertDialogs } from "@/lib/alert-dialogs";
import { useSaleStore } from "@/stores/transactions/useSaleStore";

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

  function handleStockDelete(id: string) {
    alertDialogs.open({
      title: "Hapus Item",
      description: "Apakah Anda yakin ingin menghapus item ini dari keranjang?",
      onConfirm: () => {
        alertDialogs.close();
        useSaleStore.getState().removeFromCart(id);
      },
    });
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama Barang",
      }),

      columnHelper.accessor("selling_price", {
        header: () => <div className="text-right">Harga Jual</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("capital_cost", {
        header: () => <div className="text-right">Modal</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("quantity", {
        header: () => <div className="text-right">Jumlah</div>,
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
              onClick={() => handleStockDelete(row.original.id)}
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
