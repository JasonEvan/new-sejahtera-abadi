import { ProfitTableRow } from "@/modules/report/report.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<ProfitTableRow>();

const isSalesHeader = (row: ProfitTableRow) =>
  row.invoice_value === null &&
  row.invoice_profit === null &&
  row.invoice_number !== "" &&
  row.invoice_number !== "TOTAL";

const isTotalRow = (row: ProfitTableRow) => row.invoice_number === "TOTAL";

export const columns = [
  columnHelper.display({
    id: "number",
    header: "No.",
    cell: ({ row }) => row.original.row_number ?? "",
  }),

  columnHelper.accessor("invoice_number", {
    header: "Nomor Nota",
    cell: (info) => {
      const row = info.row.original;
      if (isSalesHeader(row)) {
        return <span className="font-bold text-base">{info.getValue()}</span>;
      }
      if (isTotalRow(row)) {
        return <span className="font-semibold">{info.getValue()}</span>;
      }
      return info.getValue();
    },
  }),

  columnHelper.accessor("invoice_date", {
    header: "Tanggal",
    cell: (info) => info.getValue() || "",
  }),

  columnHelper.accessor("client_name", {
    header: "Nama Client",
  }),

  columnHelper.accessor("client_city", {
    header: "Kota",
    cell: (info) => info.getValue() ?? "",
  }),

  columnHelper.accessor("invoice_value", {
    header: () => <div className="text-right">Nilai Nota</div>,
    cell: (info) => {
      const value = info.getValue();
      if (value === null) return "";
      return (
        <div
          className={`text-right ${isTotalRow(info.row.original) ? "font-semibold" : ""}`}
        >
          {value.toLocaleString("id-ID")}
        </div>
      );
    },
  }),

  columnHelper.accessor("invoice_profit", {
    header: () => <div className="text-right">Laba</div>,
    cell: (info) => {
      const value = info.getValue();
      if (value === null) return "";
      return (
        <div
          className={`text-right ${isTotalRow(info.row.original) ? "font-semibold" : ""}`}
        >
          {value.toLocaleString("id-ID")}
        </div>
      );
    },
  }),
];
