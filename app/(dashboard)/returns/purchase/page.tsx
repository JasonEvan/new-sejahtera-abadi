import { PageTitle } from "@/components/shared/PageTitle";
import PurchaseReturnContent from "./_components/PurchaseReturnContent";

export default function PurchaseReturnPage() {
  return (
    <div>
      <PageTitle title="Retur Beli" subtitle="Buat retur pembelian" />
      <PurchaseReturnContent />
    </div>
  );
}
