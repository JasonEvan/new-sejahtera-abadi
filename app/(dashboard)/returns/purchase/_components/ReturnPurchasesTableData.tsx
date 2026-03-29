"use client";

import { DataTable } from "@/components/shared/DataTable";
import { usePurchaseReturnStore } from "@/stores/transactions/usePurchaseReturnStore";
import { useColumns } from "./columns";

export default function ReturnPurchasesTableData() {
  const lines = usePurchaseReturnStore((state) => state.lines);
  const columns = useColumns();

  return (
    <div className="mt-5">
      <DataTable data={lines} columns={columns} maxHeight="500px" />
    </div>
  );
}
