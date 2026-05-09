"use client";

import { DataTable } from "@/components/shared/DataTable";
import { useEditSaleReturnStore } from "@/stores/transactions/useEditSaleReturnStore";
import { useColumns } from "./columns";

export default function ReturnSalesTableData() {
  const lines = useEditSaleReturnStore((state) => state.lines);
  const sortedLines = [...lines].sort((a, b) => a.name.localeCompare(b.name));
  const columns = useColumns();

  return (
    <div className="mt-5">
      <DataTable data={sortedLines} columns={columns} maxHeight="500px" />
    </div>
  );
}
