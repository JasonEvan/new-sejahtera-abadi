"use client";

import { DataTable } from "@/components/shared/DataTable";
import { Spinner } from "@/components/ui/spinner";
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
      <DataTable data={receivables || []} columns={columns} maxHeight="600px" />
    </div>
  );
}
