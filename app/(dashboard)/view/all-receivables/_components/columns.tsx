import { AllReceivablesTableRow } from "@/modules/report/report.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<AllReceivablesTableRow>();

export const columns = [
  columnHelper.display({
    id: "number",
    header: "No.",
    cell: ({ row }) => {
      if (row.original.invoice_number === "TOTAL") return "";
      return row.index + 1;
    },
  }),

  columnHelper.accessor("name", {
    header: "Nama",
  }),

  columnHelper.accessor("city", {
    header: "Kota",
  }),

  columnHelper.accessor("invoice_number", {
    header: "Nomor Nota",
  }),

  columnHelper.accessor("invoice_date", {
    header: "Tanggal Nota",
  }),

  columnHelper.accessor("invoice_value", {
    header: () => <div className="text-right">Nilai Nota</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue()?.toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("paid_amount", {
    header: () => <div className="text-right">Lunas Nota</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("payment_date", {
    header: "Tanggal Bayar",
  }),

  columnHelper.accessor("balance_due", {
    header: () => <div className="text-right">Saldo Nota</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),
];
