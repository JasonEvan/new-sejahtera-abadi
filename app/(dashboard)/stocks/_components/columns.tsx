import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { Stock } from "@/modules/stock/stock.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import StockForm from "./StockForm";
import { updateStockKey } from "@/modules/stock/stock.keys";
import { alertDialogs } from "@/lib/alert-dialogs";
import { useDeleteStockMutation } from "@/modules/stock/stock.mutations";
import { useMe } from "@/modules/user/user.queries";

const columnHelper = createColumnHelper<Stock>();

export const useColumns = () => {
  const deleteStockMutation = useDeleteStockMutation();
  const { data: user } = useMe();

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

  const handleDeleteStock = useCallback(
    (id: number) => {
      alertDialogs.open({
        title: "Hapus Stock",
        description: "Apakah Anda yakin ingin menghapus stock ini?",
        onConfirm: () => {
          alertDialogs.close();
          deleteStockMutation.mutate(id);
        },
      });
    },
    [deleteStockMutation],
  );

  const canUpdate = user?.permissions?.includes("stock.update");
  const canDelete = user?.permissions?.includes("stock.delete");

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
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditStock(row.original)}
              >
                <Pencil />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDeleteStock(row.original.id)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [handleDeleteStock, canUpdate, canDelete],
  );

  return columns;
};
