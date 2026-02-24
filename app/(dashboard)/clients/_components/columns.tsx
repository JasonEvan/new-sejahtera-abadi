"use client";

import { Button } from "@/components/ui/button";
import { Client } from "@/modules/client/client.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

const columnHelper = createColumnHelper<Client>();

export const columns = [
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
    cell: () => (
      <div className="flex gap-x-2">
        <Button variant="ghost" size="icon">
          <Pencil />
        </Button>
        <Button variant="ghost" size="icon">
          <Trash2 />
        </Button>
      </div>
    ),
  }),
];
