"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { printService } from "@/lib/print.service";
import { useGetAllPayables } from "@/modules/report/report.queries";
import { columns } from "./columns";

export default function AllPayablesTable() {
  const { data: payables, isLoading, isError, error } = useGetAllPayables();

  if (isLoading) {
    return (
      <div className="flex justify-center">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center text-red-500">
        <p>Gagal memuat data utang: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="mb-3 flex justify-end">
        <Button
          onClick={() => printService.handlePrintAllPayables(payables || [])}
          disabled={!payables || payables.length === 0}
        >
          Print
        </Button>
      </div>
      <DataTable data={payables || []} columns={columns} maxHeight="600px" />
    </div>
  );
}
