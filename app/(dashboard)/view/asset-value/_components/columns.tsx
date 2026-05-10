"use client";

import { ColumnDef } from "@tanstack/react-table";
import { AssetValueTableRow } from "@/modules/report/report.types";

export const columns: ColumnDef<AssetValueTableRow>[] = [
  {
    header: "No. ",
    cell: ({ row }) => {
      return <div className="font-medium">{row.index + 1}</div>;
    },
  },
  {
    accessorKey: "itemName",
    header: "Nama Barang",
  },
  {
    accessorKey: "quantity",
    header: "Quantity (Qty)",
    cell: ({ row }) => {
      return (
        <div className="font-medium">
          {new Intl.NumberFormat("id-ID").format(row.getValue("quantity"))}
        </div>
      );
    },
  },
  {
    accessorKey: "capitalCost",
    header: "Modal",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("capitalCost"));
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
  {
    accessorKey: "totalValue",
    header: "Total Nilai",
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("totalValue"));
      const formatted = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(amount);

      return <div className="font-medium">{formatted}</div>;
    },
  },
];
