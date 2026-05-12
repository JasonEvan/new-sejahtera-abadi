import { PageTitle } from "@/components/shared/PageTitle";
import InvoiceInformation from "./_components/InvoiceInformation";
import InvoiceSummary from "./_components/InvoiceSummary";

export default function DeleteSalesPage() {
  return (
    <div>
      <PageTitle
        title="Hapus Penjualan"
        subtitle="Hapus nota penjualan yang salah input atau dibatalkan"
      />

      <div className="mt-8 space-y-6">
        <InvoiceInformation />
        <InvoiceSummary />
      </div>
    </div>
  );
}
