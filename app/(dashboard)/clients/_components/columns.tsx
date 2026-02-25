"use client";

import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { Client } from "@/modules/client/client.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useMemo } from "react";
import ClientForm from "./ClientForm";
import { editClientKey } from "@/modules/client/client.keys";
import { alertDialogs } from "@/lib/alert-dialogs";
import { useDeleteClientMutation } from "@/modules/client/client.mutations";

const columnHelper = createColumnHelper<Client>();

export const useColumns = () => {
  const deleteClientMutation = useDeleteClientMutation();

  function handleEditClient(client: Client) {
    dialogs.open({
      title: "Edit Client",
      description: "Ubah informasi client",
      type: "form",
      formId: "add-client-form",
      mutationKey: editClientKey(),
      children: <ClientForm client={client} />,
    });
  }

  const handleDeleteClient = useCallback(
    (id: number) => {
      alertDialogs.open({
        title: "Hapus Client",
        description: "Apakah Anda yakin ingin menghapus client ini?",
        onConfirm: () => {
          alertDialogs.close();
          deleteClientMutation.mutate(id);
        },
      });
    },
    [deleteClientMutation],
  );

  const columns = useMemo(
    () => [
      columnHelper.accessor("name", {
        header: "Nama",
      }),

      columnHelper.accessor("city", {
        header: "Kota",
      }),

      columnHelper.accessor("address", {
        header: "Alamat",
      }),

      columnHelper.accessor("phone", {
        header: "Telepon",
      }),

      columnHelper.accessor("mobile_phone", {
        header: "Nomor HP",
      }),

      columnHelper.display({
        id: "actions",
        header: "Aksi",
        cell: ({ row }) => (
          <div className="flex gap-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => handleEditClient(row.original)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive"
              onClick={() => handleDeleteClient(row.original.id)}
            >
              <Trash2 />
            </Button>
          </div>
        ),
      }),
    ],
    [handleDeleteClient],
  );

  return columns;
};
