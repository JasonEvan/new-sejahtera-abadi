import { InventoryLedgerTableRow } from "@/modules/report/report.types";
import { createColumnHelper } from "@tanstack/react-table";

const columnHelper = createColumnHelper<InventoryLedgerTableRow>();

export const columns = [
  columnHelper.accessor("invoice_number", {
    header: "Nomor Nota",
  }),

  columnHelper.accessor("invoice_date", {
    header: "Tanggal Nota",
  }),

  columnHelper.accessor("name", {
    header: "Nama",
  }),

  columnHelper.accessor("city", {
    header: "Kota",
  }),

  columnHelper.accessor("type", {
    header: "Tipe",
  }),

  columnHelper.accessor("price", {
    header: () => <div className="text-right">Harga</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue()?.toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("qty_in", {
    header: () => <div className="text-right">Qty In</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue()?.toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("qty_out", {
    header: () => <div className="text-right">Qty Out</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue()?.toLocaleString("id-ID")}
      </div>
    ),
  }),

  columnHelper.accessor("final_qty", {
    header: () => <div className="text-right">Qty Akhir</div>,
    cell: (info) => (
      <div className="text-right">
        {info.getValue()?.toLocaleString("id-ID")}
      </div>
    ),
  }),
];
