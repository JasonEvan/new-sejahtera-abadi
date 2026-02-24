"use client";

import { Button } from "@/components/ui/button";
import { dialogs } from "@/lib/dialogs";
import { Client } from "@/modules/client/client.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";
import { useMemo } from "react";
import ClientForm from "./ClientForm";
import { editClientKey } from "@/modules/client/client.keys";

const columnHelper = createColumnHelper<Client>();

export const useColumns = () => {
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
            <Button variant="ghost" size="icon" className="text-destructive">
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
