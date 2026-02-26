import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { Salesperson } from "@/modules/salesperson/salesperson.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import SalesmenForm from "./SalesmenForm";
import { editSalespersonKey } from "@/modules/salesperson/salesperson.keys";
import { useDeleteSalespersonMutation } from "@/modules/salesperson/salesperson.mutations";
import { alertDialogs } from "@/lib/alert-dialogs";

const columnHelper = createColumnHelper<Salesperson>();

export const useColumns = () => {
  const deleteSalespersonMutation = useDeleteSalespersonMutation();

  function handleSalesmanEdit(data: Salesperson) {
    dialogs.open({
      title: "Edit Salesman",
      description: "Ubah informasi salesman",
      type: "form",
      formId: "add-salesman-form",
      mutationKey: editSalespersonKey(),
      children: <SalesmenForm salesman={data} />,
    });
  }

  const handleDelete = useCallback(
    (id: number) => {
      alertDialogs.open({
        title: "Hapus Salesman",
        description: "Apakah Anda yakin ingin menghapus salesman ini?",
        onConfirm: () => {
          alertDialogs.close();
          deleteSalespersonMutation.mutate(id);
        },
      });
    },
    [deleteSalespersonMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama",
      }),

      columnHelper.accessor("invoice_number", {
        header: () => <div className="text-right">Nomor Nota</div>,
        cell: (info) => <div className="text-right">{info.getValue()}</div>,
      }),

      columnHelper.accessor("phone_number", {
        header: "Nomor Telepon",
      }),

      columnHelper.accessor("sales_code", {
        header: "Kode Sales",
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleSalesmanEdit(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDelete(row.original.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      }),
    ],
    [handleDelete],
  );

  return columns;
};
