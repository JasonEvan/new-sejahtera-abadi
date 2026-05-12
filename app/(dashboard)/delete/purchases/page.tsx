import { PageTitle } from "@/components/shared/PageTitle";
import InvoiceInformation from "./_components/InvoiceInformation";
import InvoiceSummary from "./_components/InvoiceSummary";

export default function DeletePurchasePage() {
  return (
    <div className="flex flex-col gap-y-4">
      <PageTitle
        title="Hapus Pembelian"
        subtitle="Hapus nota pembelian yang salah input atau dibatalkan"
      />

      <div className="mt-8 space-y-6">
        <InvoiceInformation />
        <InvoiceSummary />
      </div>
    </div>
  );
}
