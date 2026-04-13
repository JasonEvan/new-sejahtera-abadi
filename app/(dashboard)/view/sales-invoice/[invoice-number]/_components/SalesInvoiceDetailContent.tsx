"use client";

import { PageTitle } from "@/components/shared/PageTitle";
import { DataTable } from "@/components/shared/DataTable";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { useGetSalesInvoiceDetail } from "@/modules/sale/sale.queries";
import { printService } from "@/lib/print.service";
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

  const details = lines
    .filter((line) => line.name !== "TOTAL")
    .map((line) => ({
      tanggal_nota: header.invoice_date,
      nomor_nota: header.invoice_number,
      nama_client: header.client_name,
      kode_sales: "",
      alamat_client: "",
      kota_client: header.client_city,
      nama_barang: line.name,
      qty_barang: line.qty,
      satuan_barang: line.unit,
      harga_barang: line.price,
      total_harga: line.total_price,
    }));

  const total = header.invoice_value.toLocaleString("id-ID");

  return (
    <div>
      <PageTitle
        title={`Nota ${header.invoice_number}`}
        subtitle={`${header.client_name}, ${header.client_city} | ${header.invoice_date} | Nilai: ${header.invoice_value.toLocaleString("id-ID")}`}
      />
      <div className="mt-3 flex justify-end">
        <Button
          onClick={() => printService.handlePrintContinuousForm(details, total)}
        >
          Print
        </Button>
      </div>
      <div className="mt-3">
        <DataTable data={lines} columns={columns} maxHeight="600px" />
      </div>
    </div>
  );
}
