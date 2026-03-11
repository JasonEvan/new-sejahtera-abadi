"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { DataTable } from "@/components/shared/DataTable";
import { Spinner } from "@/components/ui/spinner";
import { useGetSalesInvoiceDetail } from "@/modules/sale/sale.queries";
import { columns } from "./columns";

export default function SalesInvoiceDetailContent({
  invoiceNumber,
}: {
  invoiceNumber: string;
}) {
  const { data, isLoading, isError, error } =
    useGetSalesInvoiceDetail(invoiceNumber);

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
      <PageTitle
        title={`Nota ${header.invoice_number}`}
        subtitle={`${header.client_name}, ${header.client_city} | ${header.invoice_date} | Nilai: ${header.invoice_value.toLocaleString("id-ID")}`}
      />
      <div className="mt-3">
        <DataTable data={lines} columns={columns} maxHeight="600px" />
      </div>
    </div>
  );
}
