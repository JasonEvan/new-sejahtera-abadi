import { PageTitle } from "@/components/shared/PageTitle";
import PurchaseInvoiceContent from "./_components/PurchaseInvoiceContent";

export default function PurchaseInvoicePage() {
  return (
    <div>
      <PageTitle
        title="Nota Pembelian"
        subtitle="Cari nota pembelian berdasarkan nomor nota"
      />
      <PurchaseInvoiceContent />
    </div>
  );
}
