"use client";

import { DataTable } from "@/components/shared/DataTable";
import { useEditPurchaseReturnStore } from "@/stores/transactions/useEditPurchaseReturnStore";
import { useColumns } from "./columns";

export default function ReturnPurchasesTableData() {
  const lines = useEditPurchaseReturnStore((state) => state.lines);
  const columns = useColumns();

  return (
    <div className="mt-5">
      <DataTable data={lines} columns={columns} maxHeight="500px" />
    </div>
  );
}
