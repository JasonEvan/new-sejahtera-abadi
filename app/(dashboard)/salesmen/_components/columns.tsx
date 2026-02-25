import { Button } from "@/components/ui/button";
import { Salesperson } from "@/modules/salesperson/salesperson.types";
import { createColumnHelper } from "@tanstack/react-table";
import { Pencil, Trash2 } from "lucide-react";

const columnHelper = createColumnHelper<Salesperson>();

export const columns = [
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
    cell: () => (
      <div className="flex gap-x-2">
        <Button variant="ghost" size="icon" onClick={() => {}}>
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive"
          onClick={() => {}}
        >
          <Trash2 />
        </Button>
      </div>
    ),
  }),
];
