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
import { useMe } from "@/modules/user/user.queries";

const columnHelper = createColumnHelper<Client>();

export const useColumns = () => {
  const deleteClientMutation = useDeleteClientMutation();
  const { data: user } = useMe();

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

  const canUpdate = user?.permissions?.includes("client.update");
  const canDelete = user?.permissions?.includes("client.delete");

  const columns = useMemo(
    () => [
      columnHelper.display({
        id: "number",
        header: "No.",
        cell: ({ row }) => row.index + 1,
      }),
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
            {canUpdate && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEditClient(row.original)}
              >
                <Pencil />
              </Button>
            )}
            {canDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() => handleDeleteClient(row.original.id)}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        ),
      }),
    ],
    [handleDeleteClient, canUpdate, canDelete],
  );

  return columns;
};
