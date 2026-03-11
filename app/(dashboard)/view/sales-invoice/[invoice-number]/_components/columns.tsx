import { SalesInvoiceDetailLine } from "@/modules/sale/sale.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<SalesInvoiceDetailLine>();

export const columns = [
  columnHelper.display({
    id: "no",
    header: "No",
    cell: ({ row }) => {
      if (row.original.name === "TOTAL") return "";
      return row.index + 1;
    },
  }),

  columnHelper.accessor("name", {
    header: "Nama Barang",
  }),

  columnHelper.accessor("qty", {
    header: () => <div className="text-right">Qty</div>,
    cell: (info) => {
      const value = info.getValue();
      if (value === null) return "";
      return <div className="text-right">{value}</div>;
    },
  }),

  columnHelper.accessor("unit", {
    header: "Satuan",
    cell: (info) => info.getValue() ?? "",
  }),

  columnHelper.accessor("price", {
    header: () => <div className="text-right">Harga</div>,
    cell: (info) => {
      const value = info.getValue();
      if (value === null) return "";
      return <div className="text-right">{value.toLocaleString("id-ID")}</div>;
    },
  }),

  columnHelper.accessor("total_price", {
    header: () => <div className="text-right">Total Harga</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue().toLocaleString("id-ID")}
      </div>
    ),
  }),
];
