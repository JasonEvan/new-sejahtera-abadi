"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { printService } from "@/lib/print.service";
import { useGetAllReceivables } from "@/modules/report/report.queries";
import { columns } from "./columns";

export default function AllReceivablesTable() {
  const {
    data: receivables,
    isLoading,
    isError,
    error,
  } = useGetAllReceivables();

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
        <p>Gagal memuat data piutang: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="mb-3 flex justify-end">
        <Button
          onClick={() => printService.handlePrintAllReceivables(receivables || [])}
          disabled={!receivables || receivables.length === 0}
        >
          Print
        </Button>
      </div>
      <DataTable data={receivables || []} columns={columns} maxHeight="600px" />
    </div>
  );
}
