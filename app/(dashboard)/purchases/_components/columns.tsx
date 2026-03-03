import { Button } from "@/components/ui/button";
import { alertDialogs } from "@/lib/alert-dialogs";
import { dialogs } from "@/lib/dialogs";
import { PurchaseTableRow } from "@/modules/purchase/purchase.types";
import { usePurchaseStore } from "@/stores/transactions/usePurchaseStore";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import EditItemForm from "./EditItemForm";

const columnHelper = createColumnHelper<PurchaseTableRow>();

export const useColumns = () => {
  function handlePurchaseEdit(data: PurchaseTableRow) {
    dialogs.open({
      title: "Edit Item",
      description: "Ubah item yang dibeli",
      type: "form",
      formId: "edit-purchase-item-form",
      children: <EditItemForm data={data} />,
    });
  }

  function handlePurchaseDelete(id: string) {
    alertDialogs.open({
      title: "Hapus Item",
      description: "Apakah Anda yakin ingin menghapus item ini dari keranjang?",
      onConfirm: () => {
        alertDialogs.close();
        usePurchaseStore.getState().removeFromCart(id);
      },
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
              onClick={() => handlePurchaseEdit(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handlePurchaseDelete(row.original.id)}
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
