import { PageTitle } from "@/components/shared/PageTitle";
import SalesInvoiceContent from "./_components/SalesInvoiceContent";

export default function SalesInvoicePage() {
  return (
    <div>
      <PageTitle
        title="Nota Penjualan"
        subtitle="Cari nota penjualan berdasarkan nomor nota"
      />
      <SalesInvoiceContent />
    </div>
  );
}
