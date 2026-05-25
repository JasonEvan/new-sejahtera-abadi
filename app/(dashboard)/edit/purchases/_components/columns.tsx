import { Button } from "@/components/ui/button";
import { alertDialogs } from "@/lib/alert-dialogs";
import { dialogs } from "@/lib/dialogs";
import {
  EditPurchaseItemRow,
  useEditPurchaseStore,
} from "@/stores/transactions/useEditPurchaseStore";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import EditItemForm from "./EditItemForm";

const columnHelper = createColumnHelper<EditPurchaseItemRow>();

export const useColumns = () => {
  function handleItemEdit(data: EditPurchaseItemRow) {
    dialogs.open({
      title: "Edit Item",
      description: "Ubah item pada nota",
      type: "form",
      formId: "edit-purchase-item-form",
      children: <EditItemForm data={data} />,
    });
  }

  function handleItemDelete(id: string) {
    alertDialogs.open({
      title: "Hapus Item",
      description: "Apakah Anda yakin ingin menghapus item ini dari nota?",
      onConfirm: () => {
        alertDialogs.close();
        useEditPurchaseStore.getState().removeItem(id);
      },
    });
  }

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "number",
        header: "No.",
        cell: ({ row }) => row.index + 1,
      }),

      columnHelper.accessor("name", {
        header: "Nama Barang",
      }),

      columnHelper.accessor("capital_cost", {
        header: () => <div className="text-right">Modal</div>,
        cell: (info) => (
          <div className="text-right">
            {info.getValue().toLocaleString("id-ID")}
          </div>
        ),
      }),

      columnHelper.accessor("product_price", {
        header: () => <div className="text-right">Harga</div>,
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
              onClick={() => handleItemEdit(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleItemDelete(row.original.id)}
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
