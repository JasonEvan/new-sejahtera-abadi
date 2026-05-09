import { PurchaseInvoiceRow } from "@/modules/purchase/purchase.types";
import { createColumnHelper } from "@tanstack/react-table";
import Link from "next/link";

const columnHelper = createColumnHelper<PurchaseInvoiceRow>();

export const columns = [
  columnHelper.display({
    id: "number",
    header: "No.",
    cell: (info) => info.row.index + 1,
  }),

  columnHelper.accessor("invoice_number", {
    header: "Nomor Nota",
    cell: (info) => (
      <Link
        href={`/view/purchase-invoice/${encodeURIComponent(info.getValue())}`}
        className="text-blue-600 underline hover:text-blue-800"
      >
        {info.getValue()}
      </Link>
    ),
  }),

  columnHelper.accessor("name", {
    header: "Nama",
  }),

  columnHelper.accessor("city", {
    header: "Kota",
  }),

  columnHelper.accessor("invoice_value", {
    header: () => <div className="text-right">Nilai Nota</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("balance_due", {
    id: "status",
    header: "Status",
    cell: (info) => {
      const isSettled = info.getValue() === 0;
      return (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            isSettled
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isSettled ? "Settled" : "Unsettled"}
        </span>
      );
    },
  }),
];
