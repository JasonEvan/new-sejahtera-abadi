"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { PageTitle } from "@/components/shared/PageTitle";
import { DataTable } from "@/components/shared/DataTable";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useGetPurchaseInvoiceDetail } from "@/modules/purchase/purchase.queries";
import { columns } from "./columns";

export default function PurchaseInvoiceDetailContent({
  invoiceNumber,
}: {
  invoiceNumber: string;
}) {
  const router = useRouter();
  const { data, isLoading, isError, error } =
    useGetPurchaseInvoiceDetail(invoiceNumber);

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
        <p>Gagal memuat data nota: {error.message}</p>
      </div>
    );
  }

  if (!data) return null;

  const { header, lines } = data;

  return (
    <div>
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-2 p-0 hover:bg-transparent"
      >
        <ChevronLeft className="mr-1 h-4 w-4" />
        Kembali
      </Button>
      <PageTitle
        title={`Nota ${header.invoice_number}`}
        subtitle={`${header.client_name}, ${header.client_city} | ${header.invoice_date} | Nilai: ${header.invoice_value.toLocaleString("id-ID")}`}
      />
      <div className="mt-3 flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={() => {
            window.location.href = `/api/export/purchase-invoice/${encodeURIComponent(header.invoice_number)}`;
          }}
        >
          Export Excel
        </Button>
      </div>
      <div className="mt-3">
        <DataTable data={lines} columns={columns} maxHeight="600px" />
      </div>
    </div>
  );
}
