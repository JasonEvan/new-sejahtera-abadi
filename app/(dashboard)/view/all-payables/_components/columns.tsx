import { AllPayablesTableRow } from "@/modules/report/report.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<AllPayablesTableRow>();

export const columns = [
  columnHelper.display({
    id: "number",
    header: "No.",
    cell: ({ row }) => {
      if (row.original.name === "TOTAL") return "";
      return row.index + 1;
    },
  }),

  columnHelper.accessor("name", {
    header: "Nama Client",
  }),

  columnHelper.accessor("invoice_value", {
    header: () => <div className="text-right">Total Nilai Nota</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("paid_amount", {
    header: () => <div className="text-right">Total Lunas</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("balance_due", {
    header: () => <div className="text-right">Total Saldo</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),
];
