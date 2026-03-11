import { ClientReceivablesTableRow } from "@/modules/report/report.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<ClientReceivablesTableRow>();

export const columns = [
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
        {info.getValue().toLocaleString("id-ID")}
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
    header: "Tanggal Lunas",
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
